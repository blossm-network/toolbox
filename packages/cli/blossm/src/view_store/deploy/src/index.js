const fs = require("fs");
const path = require("path");
const viewStore = require("@blossm/mongodb-view-store");
const { get: secret } = require("@blossm/gcp-secret");

const query =
  fs.existsSync(path.resolve(__dirname, "./query.js")) && require("./query");
const update =
  fs.existsSync(path.resolve(__dirname, "./update.js")) && require("./update");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  secretFn: secret,
  ...(query && { queryFn: query }),
  ...(update && { updateFn: update }),
  ...(config.one && { one: config.one }),
});
