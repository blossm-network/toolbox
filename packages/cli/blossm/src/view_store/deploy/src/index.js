import viewStore from "@blossm/mongodb-view-store";
import gcpSecret from "@blossm/gcp-secret";
import fact from "@blossm/fact-rpc";
import gcpToken from "@blossm/gcp-token";

import optionalImport from "./optional_import.js";

const query = await optionalImport(new URL("./query.js", import.meta.url));
const sort = await optionalImport(new URL("./sort.js", import.meta.url));
const update = await optionalImport(new URL("./update.js", import.meta.url));
const format = await optionalImport(new URL("./format.js", import.meta.url));
const empty = await optionalImport(new URL("./empty.js", import.meta.url));
const formatCsv = await optionalImport(new URL("./format_csv.js", import.meta.url));

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
      service: "core",
      network: process.env.CORE_NETWORK,
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
