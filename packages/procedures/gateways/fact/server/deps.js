import get from "@blossm/fact-gateway-get";
import server from "@blossm/server";
import corsMiddleware from "@blossm/cors-middleware";
import authorization from "@blossm/authorization-middleware";
import authentication from "@blossm/authentication-middleware";

export default {
  get,
  server,
  corsMiddleware,
  authorization,
  authentication,
};
