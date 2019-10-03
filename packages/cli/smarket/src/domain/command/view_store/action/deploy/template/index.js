const fs = require("fs");
const viewStore = require("@sustainers/view-store");

const get = fs.existsSync("./get") && require("./get");
const post = fs.existsSync("./post") && require("./post");
const put = fs.existsSync("./put") && require("./put");

const config = require("./config.json");

module.exports = viewStore({
  schema: config.schema,
  indexes: config.indexes,
  ...(get && { getFn: get }),
  ...(post && { postFn: post }),
  ...(put && { putFn: put })
});
