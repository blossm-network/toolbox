const fs = require("fs");
const path = require("path");
const viewStore = require("@blossm/mongodb-view-store");
const { get: secret } = require("@blossm/gcp-secret");

const query =
  fs.existsSync(path.resolve(__dirname, "./query.js")) && require("./query");
const put =
  fs.existsSync(path.resolve(__dirname, "./put.js")) && require("./put");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  secretFn: secret,
  ...(query && { queryFn: query }),
  ...(put && { postFn: put }),
  ...(config.one && { one: config.one }),
});
