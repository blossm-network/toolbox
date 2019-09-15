const datetime = require("@sustainers/datetime");

const deps = require("./deps");

module.exports = ({ action, domain, service, network }) => {
  return {
    with: ({ payload, trace, source, tokenFn }) => {
      const headers = {
        issued: datetime.fineTimestamp(),
        ...(trace != undefined && { trace }),
        ...(source != undefined && { source })
      };

      const data = { payload, headers };

      return {
        in: async context =>
          await deps
            .operation(`${action}.${domain}`)
            .post({
              data,
              context,
              tokenFn
            })
            .on({ service, network })
      };
    }
  };
};
