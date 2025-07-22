import logger from "@blossm/logger";

import deps from "./deps.js";

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

export default ({region = process.env.GCP_REGION, operationNameComponentQueries, fn, sortFn}) => {
  return {
    in: ({ context, network, host = process.env.HOST }) => {
      return {
        with: async ({
          path,
          internalTokenFn,
          externalTokenFn,
          currentToken,
          claims,
        } = {}) => {
          const internal = host == process.env.HOST;

          const formattedRequests = [];
          for (const { operationNameComponents, query } of operationNameComponentQueries) {
            const id = query.id;
            delete query.id;

            let token, type, url;

            if (internal) {

              const hash = deps.hash(...operationNameComponents);

              const { token: _token, type: _type } = await deps.operationToken({
                      tokenFn: internalTokenFn,
                      operationNameComponents: operationNameComponents,
                      hash
                    });
              token = _token;
              type = _type;

              url = deps.operationUrl({
                protocol: process.env.NODE_ENV == "local" ? "http" : "https",
                host: process.env.NODE_ENV == "local" ? `${hash}.${host}` : `${region}-${deps.operationShortName(operationNameComponents)}-${hash}-${process.env.GCP_COMPUTE_URL_ID}.${region}.run.app`,
                ...(path && { path }),
                ...(id && { id }),
              });

            } else {

              const { token: _token, type: _type } = await deps.networkToken({
                      tokenFn: externalTokenFn,
                      network,
                    }) || {};

              token = _token;
              type = _type;

              url = deps.networkUrl({
                host,
                ...(path && { path }),
                ...(id && { id }),
              });
          }

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
            operationNameComponentQueries,
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
