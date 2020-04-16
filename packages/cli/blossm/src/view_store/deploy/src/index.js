const fs = require("fs");
const viewStore = require("@blossm/mongodb-view-store");

const query = fs.existsSync("./query.js") && require("./query");
// const post = fs.existsSync("./post.js") && require("./post");
const put = fs.existsSync("./put.js") && require("./put");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  ...(query && { queryFn: query }),
  // ...(post && { postFn: post }),
  ...(put && { postFn: put }),
});
