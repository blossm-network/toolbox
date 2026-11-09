import post from "@blossm/command-gateway-post";
import server from "@blossm/server";
import corsMiddleware from "@blossm/cors-middleware";
import authorization from "@blossm/authorization-middleware";
import authentication from "@blossm/authentication-middleware";
import multer from "multer";

export default {
  post,
  server,
  corsMiddleware,
  authorization,
  authentication,
  uploader: (limits) =>
    multer({
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10,
        fields: 100,
        fieldSize: 1024 * 1024,
        parts: 110,
        ...limits,
      },
    }).any(),
};
