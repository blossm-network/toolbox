const stream = require("./_stream");

module.exports = ({ instance, tableName, rowKeyDelineator }) => {
  // eslint-disable-next-line no-console
  console.log("HYDRATTTIN: ", tableName);

  const table = instance.table(tableName);
  return async ({ root }) => {
    if (!(await table.exists())) return null;
    return new Promise((resolve, reject) => {
      let hydrated = {};
      stream({ table, rowKeyDelineator, root, from: 0 })
        .on("error", err => reject(err))
        .on("data", row => {
          const event = JSON.parse(row.data);
          // eslint-disable-next-line no-console
          console.log("addding! ", event.payload);
          hydrated = { ...hydrated, ...event.payload };
        })
        .on("end", () => {
          // eslint-disable-next-line no-console
          console.log("DONE! ", hydrated);
          resolve(hydrated);
        });
    });
  };
};
