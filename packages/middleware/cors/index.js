const deps = require("./deps");

module.exports = ({ app, whitelist, credentials = false, methods = [] }) => {
  app.use(
    deps.cors({
      origin: deps.whitelist([`https://${process.env.NETWORK}`, ...whitelist])
        .check,
      methods: methods.join(","),
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials,
    })
  );
  app.options("*", deps.cors());
};
