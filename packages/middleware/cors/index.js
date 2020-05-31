const deps = require("./deps");

module.exports = ({ app, whitelist, credentials = false, methods = [] }) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ whitelist });
  app.use(
    deps.cors({
      origin: deps.whitelist(whitelist).check,
      methods: methods.join(","),
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials,
    })
  );
  app.options("*", deps.cors());
};
