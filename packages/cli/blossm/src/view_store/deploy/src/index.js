const fs = require("fs");
const path = require("path");
const viewStore = require("@blossm/mongodb-view-store");
const { get: secret } = require("@blossm/gcp-secret");
const fact = require("@blossm/fact-rpc");
const gcpToken = require("@blossm/gcp-token");

const query =
  fs.existsSync(path.resolve(__dirname, "./query.js")) && require("./query");
const sort =
  fs.existsSync(path.resolve(__dirname, "./sort.js")) && require("./sort");
const update =
  fs.existsSync(path.resolve(__dirname, "./update.js")) && require("./update");
const format =
  fs.existsSync(path.resolve(__dirname, "./format.js")) && require("./format");
const empty =
  fs.existsSync(path.resolve(__dirname, "./empty.js")) && require("./empty");
const formatCsv =
  fs.existsSync(path.resolve(__dirname, "./format_csv.js")) &&
  require("./format_csv");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  sorts: config.sorts,
  secretFn: secret,
  ...(config.keys && { updateKeys: config.keys }),
  ...(query && { queryFn: query }),
  ...(formatCsv && { formatCsvFn: formatCsv }),
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
          key: "access",
        },
      })
      .read();

    return body;
  },
});
