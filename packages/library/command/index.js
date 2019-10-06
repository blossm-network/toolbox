const { string: dateString } = require("@sustainers/datetime");

const deps = require("./deps");

module.exports = ({ action, domain, service, network }) => {
  return {
    issue: (payload, { trace, source } = {}) => {
      const headers = {
        issued: dateString(),
        ...(trace != undefined && { trace }),
        ...(source != undefined && { source })
      };

      const data = { payload, headers };

      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(action, domain, "command-handler")
                .post(data)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    }
  };
};
