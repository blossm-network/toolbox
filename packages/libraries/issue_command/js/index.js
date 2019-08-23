const request = require("@sustainer-network/request");
const datetime = require("@sustainer-network/datetime");

module.exports = ({ action, domain, service }) => {
  return {
    with: async (payload, { body } = {}) => {
      const params = { payload };
      if (body) {
        params.traceId = body.traceId;
        params.issuerInfo = body.issuerInfo;
        params.sourceCommand = body.sourceCommand;
      }

      params.issuedTimestamp = datetime.fineTimestamp();

      const isStaging = process.env.NODE_ENV == "staging";

      await request.post(
        `https://${action}.${domain}.${service}${
          isStaging ? ".staging" : ""
        }.sustainer.network`,
        params
      );
    }
  };
};
