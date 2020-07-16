const logger = require("@blossm/logger");

const deps = require("./deps");

const jsonString = (string) => {
  let objectOpenIndex;
  let objectCloseIndex;
  let openCount = 0;
  const parsedData = [];
  for (let i = 0; i < string.length; i++) {
    const char = string.charAt(i);
    if (char == "{") {
      if (objectOpenIndex == undefined) objectOpenIndex = i;
      openCount++;
    } else if (char == "}") {
      openCount--;
      if (openCount == 0) {
        parsedData.push(
          JSON.parse(string.substr(objectOpenIndex, i - objectOpenIndex + 1))
        );
        objectOpenIndex = null;
        objectCloseIndex = i + 1;
      }
    }
  }
  return { parsedData, leftover: string.substr(objectCloseIndex) };
};

module.exports = (operationQueries, fn, sortFn) => {
  return {
    in: ({ context, network, host = process.env.HOST }) => {
      return {
        with: async ({
          path,
          internalTokenFn,
          externalTokenFn,
          currentToken,
          key,
          claims,
        } = {}) => {
          const internal = host == process.env.HOST;

          const formattedRequests = [];
          for (const { operation, query } of operationQueries) {
            const id = query.id;
            delete query.id;
            const { token, type } =
              (internal
                ? await deps.operationToken({
                    tokenFn: internalTokenFn,
                    operation,
                  })
                : await deps.networkToken({
                    tokenFn: externalTokenFn,
                    network,
                    key,
                  })) || {};

            const url = internal
              ? deps.operationUrl({
                  operation,
                  host,
                  ...(path && { path }),
                  ...(id && { id }),
                })
              : deps.networkUrl({
                  host,
                  ...(path && { path }),
                  ...(id && { id }),
                });

            const requestQuery = {
              ...(query && { ...query }),
              ...(internal && {
                ...(context && { context }),
                ...(claims && { claims }),
                ...(currentToken && { token: currentToken }),
              }),
            };

            formattedRequests.push({
              url,
              query: requestQuery,
              ...(token && {
                headers: {
                  authorization: `${type} ${token}`,
                },
              }),
            });
          }

          let progress = "";
          const response = await deps.streamMany(
            formattedRequests,
            async (data) => {
              const string = data.toString();
              let { parsedData, leftover } = jsonString(progress + string);
              for (const d of parsedData) await fn(d);
              progress = leftover;
            },
            sortFn
          );

          if (!response || response.statusCode < 300) return;

          logger.info("stream errored: ", {
            response,
            operationQueries,
            context,
            network,
          });
          const {
            parsedData: [parsedBody],
          } = response.body ? jsonString(response.body) : null;
          throw deps.constructError({
            statusCode: response.statusCode,
            message: (parsedBody && parsedBody.message) || "Not specified",
            ...(parsedBody && parsedBody.info && { info: parsedBody.info }),
            ...(parsedBody && parsedBody.code && { code: parsedBody.code }),
          });
        },
      };
    },
  };
};
