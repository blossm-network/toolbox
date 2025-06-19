import get from "@blossm/view-gateway-get";
import channel from "@blossm/view-gateway-channel";
import server from "@blossm/server";
import corsMiddleware from "@blossm/cors-middleware";
import authorization from "@blossm/authorization-middleware";
import authentication from "@blossm/authentication-middleware";

export default {
  get,
  channel,
  server,
  corsMiddleware,
  authorization,
  authentication,
};
