const deps = require("./deps");

module.exports = ({ app, whitelist, credentials = false }) => {
  app.use(
    deps.cors({
      origin: deps.whitelist(whitelist).check,
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials
    })
  );
  app.options("*", deps.cors());
};
