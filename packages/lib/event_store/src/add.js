const initializeTable = async (table, columnFamilyId) => {
  const options = {
    families: [
      {
        name: columnFamilyId
      }
    ]
  };

  await table.create(options);
};

module.exports = ({
  instance,
  tableName,
  rowKeyDelineator,
  columnFamilyId,
  columnQualifier
}) => {
  let table = instance.table(tableName);
  return async ({ event }) => {
    const [tableExists] = await table.exists();
    if (!tableExists) await initializeTable(table, columnFamilyId);
    const row = {
      key: `${event.fact.root}${rowKeyDelineator}${event.fact.createdTimestamp}`,
      data: {
        [columnFamilyId]: {
          [columnQualifier]: JSON.stringify(event)
        }
      }
    };
    await table.insert(row);
    return row;
  };
};
