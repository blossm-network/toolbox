const deps = require("./deps");
const authentication = require("@sustainers/authentication-middleware");
const authorization = require("@sustainers/authorization-middleware");
const corsMiddleware = require("@sustainers/cors-middleware");

const whitelist = [
  "127.0.0.1",
  "http://127.0.0.1:4200",
  "http://0.0.0.0:4200",
  `https://${process.env.network}`
];

module.exports = async () => {
  deps
    .server({
      prehook: app => corsMiddleware({ app, whitelist, credentials: true })
    })
    .post(deps.auth(), {
      path: "/auth"
    })
    .post(deps.command(), {
      path: "/command/:domain/:action",
      preMiddleware: [authentication, authorization]
    })
    .get(deps.viewStore(), {
      path: "/view/:domain/:name",
      preMiddleware: [authentication, authorization]
    })
    .listen();
};
