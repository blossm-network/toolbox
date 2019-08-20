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
          const event = row.data[columnFamilyId][columnQualifier][0];
          // eslint-disable-next-line no-console
          console.log("row! ", row);
          // eslint-disable-next-line no-console
          console.log("row spec! ", row.data[columnFamilyId][columnQualifier]);
          // eslint-disable-next-line no-console
          console.log(
            "length! ",
            row.data[columnFamilyId][columnQualifier].length
          );
          // eslint-disable-next-line no-console
          console.log("row event! ", event);
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
