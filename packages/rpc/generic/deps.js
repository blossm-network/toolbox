import request from "@blossm/request";
import { construct } from "@blossm/errors";
import operationToken from "@blossm/operation-token";
import enqueueOperation from "@blossm/enqueue-operation";
import operationUrl from "@blossm/operation-url";
import networkToken from "@blossm/network-token";
import networkUrl from "@blossm/network-url";
import hash from "@blossm/operation-hash";
import operationShortName from "@blossm/operation-short-name";

export default {
  post: request.post,
  put: request.put,
  get: request.get,
  del: request.del,
  stream: request.stream,
  constructError: construct,
  operationUrl,
  operationToken,
  enqueueOperation,
  networkUrl,
  networkToken,
  hash, 
  operationShortName
}
