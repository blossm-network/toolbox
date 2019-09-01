const request = require("@sustainers/request");
const datetime = require("@sustainers/datetime");

module.exports = ({ action, domain, service }) => {
  return {
    with: async (payload, { params } = {}) => {
      const data = { payload };
      if (params) {
        data.traceId = params.traceId;
        data.issuerInfo = params.issuerInfo;
        data.sourceCommand = params.sourceCommand;
      }

      data.issuedTimestamp = datetime.fineTimestamp();

      const isStaging = process.env.NODE_ENV == "staging";

      await request.post(
        `https://${action}.${domain}.${service}${
          isStaging ? ".staging" : ""
        }.sustainer.network`,
        data
      );
    }
  };
};
