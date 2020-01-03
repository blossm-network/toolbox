const fs = require("fs");
const viewStore = require("@blossm/mongodb-view-store");

const get = fs.existsSync("./get.js") && require("./get");
const put = fs.existsSync("./put.js") && require("./put");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  ...(get && { getFn: get }),
  ...(put && { putFn: put })
});
