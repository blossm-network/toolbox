const deps = require("./deps");
const authenticationMiddleware = require("@sustainers/authentication-middleware");
const authorizationMiddleware = require("@sustainers/authorization-middleware");

module.exports = async () => {
  deps
    .server({
      premiddleware: [authenticationMiddleware, authorizationMiddleware]
    })
    .post(deps.post())
    .get(deps.get())
    .listen();
};
