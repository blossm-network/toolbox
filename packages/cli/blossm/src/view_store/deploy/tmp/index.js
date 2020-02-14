const fs = require("fs");
const viewStore = require("@blossm/mongodb-view-store");

const query = fs.existsSync("./query.js") && require("./query");
const data = fs.existsSync("./data.js") && require("./data");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  ...(query && { queryFn: query }),
  ...(data && { dataFn: data })
});
