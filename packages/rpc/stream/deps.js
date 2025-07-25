import request from "@blossm/request";
import { construct } from "@blossm/errors";
import operationToken from "@blossm/operation-token";
import operationUrl from "@blossm/operation-url";
import networkToken from "@blossm/network-token";
import networkUrl from "@blossm/network-url";
import hash from "@blossm/hash";
import operationShortName from "@blossm/operation-short-name";

export default {
  constructError: construct,
  operationUrl,
  operationToken,
  networkUrl,
  networkToken,
  streamMany: request.streamMany,
  hash,
  operationShortName,
};
