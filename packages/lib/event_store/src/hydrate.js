const stream = require("./_stream");

module.exports = ({ instance, tableName, rowKeyDelineator }) => {
  // eslint-disable-next-line no-console
  console.log("HYDRATTTIN: ", tableName);

  const table = instance.table(tableName);
  return async ({ root }) => {
    if (!(await table.exists())) return null;
    return new Promise((resolve, reject) => {
      let hydrated = {};
      stream({ table, rowKeyDelineator, root })
        .on("error", err => reject(err))
        .on("data", row => {
          // eslint-disable-next-line no-console
          console.log("row! ", row);
          // eslint-disable-next-line no-console
          console.log("addding! ", row.data.payload);
          hydrated = { ...hydrated, ...row.data.payload };
        })
        .on("end", () => {
          // eslint-disable-next-line no-console
          console.log("DONE! ", hydrated);
          resolve(hydrated);
        });
    });
  };
};
