import viewStore from "@blossm/mongodb-view-store";
import gcpSecret from "@blossm/gcp-secret";
import fact from "@blossm/fact-rpc";
import gcpToken from "@blossm/gcp-token";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

let query;
try {
  query = (await import("./query.js")).default;
} catch (e) {
  // query.js does not exist, query remains undefined
}

let sort;
try {
  sort = (await import("./sort.js")).default;
} catch (e) {
  // sort.js does not exist, sort remains undefined
}

let update;
try {
  update = (await import("./update.js")).default;
} catch (e) {
  // update.js does not exist, update remains undefined
}

let format;
try {
  format = (await import("./format.js")).default;
} catch (e) {
  // format.js does not exist, format remains undefined
}

let empty;
try {
  empty = (await import("./empty.js")).default;
} catch (e) {
  // empty.js does not exist, empty remains undefined
}

let formatCsv;
try {
  formatCsv = (await import("./format_csv.js")).default;
} catch (e) {
  // format_csv.js does not exist, formatCsv remains undefined
}

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
