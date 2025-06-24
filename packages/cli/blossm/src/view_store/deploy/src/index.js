import fs from "fs";
import path from "path";
import viewStore from "@blossm/mongodb-view-store";
import gcpSecret from "@blossm/gcp-secret";
import fact from "@blossm/fact-rpc";
import gcpToken from "@blossm/gcp-token";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const query =
  fs.existsSync(path.resolve(__dirname, "./query.js")) && import("./query");
const sort =
  fs.existsSync(path.resolve(__dirname, "./sort.js")) && import("./sort");
const update =
  fs.existsSync(path.resolve(__dirname, "./update.js")) && import("./update");
const format =
  fs.existsSync(path.resolve(__dirname, "./format.js")) && import("./format");
const empty =
  fs.existsSync(path.resolve(__dirname, "./empty.js")) && import("./empty");
const formatCsv =
  fs.existsSync(path.resolve(__dirname, "./format_csv.js")) &&
  import("./format_csv");

import config from "./config.json" with { type: "json" };

export default viewStore({
  schema: config.schema,
  indexes: config.indexes,
  sorts: config.sorts,
  secretFn: gcpSecret.get,
  ...(config.keys && { updateKeys: config.keys }),
  ...(query && { queryFn: query }),
  ...(formatCsv && { formatCsv }),
  ...(sort && { sortFn: sort }),
  ...(update && { updateFn: update }),
  ...(format && { formatFn: format }),
  ...(empty && { emptyFn: empty }),
  ...(config.one && { one: config.one }),
  ...(config.group && { group: config.group }),
  groupsLookupFn: async ({ token }) => {
    const { body } = await fact({
      name: "groups",
      domain: "principal",
      service: "base",
      network: process.env.BASE_NETWORK,
    })
      .set({
        token: {
          externalFn: () => ({ token, type: "Bearer" }),
          internalFn: gcpToken,
        },
      })
      .read();

    return body;
  },
});
