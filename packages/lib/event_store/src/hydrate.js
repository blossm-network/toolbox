const stream = require("./_stream");

module.exports = ({ instance, storeId, rowKeyDelineator }) => {
  const table = instance.table(storeId);
  return async ({ root }) => {
    if (!(await table.exists())) return null;
    return new Promise((resolve, reject) => {
      let hydrated = {};
      stream({ table, rowKeyDelineator, root, from: 0 })
        .on("error", err => reject(err))
        .on("data", row => {
          const event = JSON.parse(row.data);
          hydrated = { ...hydrated, ...event.payload };
        })
        .on("end", () => {
          resolve(hydrated);
        });
    });
  };
};
