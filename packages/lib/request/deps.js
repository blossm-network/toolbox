import { openAsBlob } from "node:fs";
import urlEncodeQueryData from "@blossm/url-encode-query-data";
import { construct } from "@blossm/errors";

export default {
  fetch: (...args) => fetch(...args),
  openAsBlob,
  urlEncodeQueryData,
  constructError: construct,
};
