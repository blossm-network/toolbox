const request = require("@sustainer-network/request");
const datetime = require("@sustainer-network/datetime");

module.exports = ({ storeId, serviceDomain }) => {
  const isStaging = process.env.NODE_ENV == "staging";
  return {
    add: async ({
      fact: {
        root,
        topic,
        version,
        traceId,
        commandInstanceId,
        command,
        commandIssuedTimestamp
      },
      payload
    }) => {
      const event = {
        fact: {
          root,
          topic,
          version,
          commandInstanceId,
          command,
          ...(commandIssuedTimestamp && { commandIssuedTimestamp }),
          ...(traceId && { traceId }),
          createdTimestamp: datetime.fineTimestamp()
        },
        payload
      };

      await request.post(
        `https://event-store${
          isStaging ? ".staging" : ""
        }.${serviceDomain}/add`,
        { event, storeId }
      );
    },
    hydrate: async root => {
      await request.get(
        `https://event-store${
          isStaging ? ".staging" : ""
        }.${serviceDomain}/hydrate`,
        { root, storeId }
      );
    }
  };
};
