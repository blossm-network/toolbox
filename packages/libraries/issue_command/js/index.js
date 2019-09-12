const datetime = require("@sustainers/datetime");

const deps = require("./deps");

module.exports = ({ action, domain, service, network }) => {
  return {
    with: (payload, { trace, source } = {}) => {
      const header = {
        issued: datetime.fineTimestamp(),
        ...(trace != undefined && { trace }),
        ...(source != undefined && { source })
      };

      const data = { payload, header };

      return {
        in: async context =>
          await deps
            .operation(`${action}.${domain}`)
            .post({
              data,
              context
            })
            .on({ service, network })
      };
    }
  };
};
