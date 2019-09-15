const deps = require("./deps");

module.exports = ({ app, whitelist }) => {
  app.use(
    deps.cors({
      origin: deps.whitelist(whitelist).check,
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    })
  );
  app.options("*", deps.cors());
};
