import request from "@blossm/request";
import operationToken from "@blossm/operation-token";
import operationUrl from "@blossm/operation-url";
import networkToken from "@blossm/network-token";
import networkUrl from "@blossm/network-url";
import hash from "@blossm/operation-hash";
import operationShortName from "@blossm/operation-short-name";

export default {
  operationUrl,
  operationToken,
  networkUrl,
  networkToken,
  streamMany: request.streamMany,
  jsonDecoder: request.jsonDecoder,
  hash,
  operationShortName,
};
