const get = require("@sustainers/view-gateway-get");
const server = require("@sustainers/server");
const corsMiddleware = require("@sustainers/cors-middleware");
const authorization = require("@sustainers/authorization-middleware");

exports.get = get;
exports.server = server;
exports.corsMiddleware = corsMiddleware;
exports.authorization = authorization;
