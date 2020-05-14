const fs = require("fs");
const viewStore = require("@blossm/mongodb-view-store");

const query = fs.existsSync("./query.js") && require("./query");
const put = fs.existsSync("./put.js") && require("./put");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  ...(query && { queryFn: query }),
  ...(put && { postFn: put }),
  ...(config.one && { one: config.one }),
});
