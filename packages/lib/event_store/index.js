const add = require("./src/add");
const hydrate = require("./src/hydrate");

const deps = require("./deps");

const rowKeyDelineator = "#";

module.exports = ({ storeId }) => {
  const instance = deps.bigtable.instance(process.env.STORE_INSTANCE);
  return {
    add: add({ instance, storeId, rowKeyDelineator }),
    hydrate: hydrate({ instance, storeId, rowKeyDelineator })
  };
};
