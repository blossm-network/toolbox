import server from "@blossm/server";
import get from "@blossm/view-store-get";
import idStream from "@blossm/view-store-id-stream";
import put from "@blossm/view-store-put";
import del from "@blossm/view-store-delete";

export default {
  server,
  get,
  idStream,
  put,
  del: del,
};
