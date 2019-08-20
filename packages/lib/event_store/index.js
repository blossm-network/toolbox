const add = require("./src/add");
const hydrate = require("./src/hydrate");

const deps = require("./deps");

const rowKeyDelineator = "#";

module.exports = ({ storeId, service }) => {
  const instance = deps.bigtable.instance(process.env.STORE_INSTANCE);
  const tableName = `${service}-${storeId}`;
  return {
    add: add({ instance, tableName, rowKeyDelineator }),
    hydrate: hydrate({ instance, tableName, rowKeyDelineator })
  };
};
