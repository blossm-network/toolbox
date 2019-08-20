const stream = require("./_stream");

module.exports = ({
  instance,
  tableName,
  rowKeyDelineator,
  columnFamilyId,
  columnQualifier
}) => {
  // eslint-disable-next-line no-console
  console.log("HYDRATTTIN: ", tableName);

  const table = instance.table(tableName);
  return async ({ root }) => {
    if (!(await table.exists())) return null;
    return new Promise((resolve, reject) => {
      let hydrated = {};
      stream({
        table,
        root,
        rowKeyDelineator
      })
        .on("error", err => reject(err))
        .on("data", row => {
          const data = row.data[columnFamilyId][columnQualifier][0];
          // eslint-disable-next-line no-console
          console.log("row event! ", data.value);

          const event = JSON.parse(data.value);

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
