const initializeTable = async (table, columnFamilyId) => {
  const options = {
    families: [
      {
        name: columnFamilyId
      }
    ]
  };

  // eslint-disable-next-line no-console
  console.log("bout to create");

  await table.create(options);
};

module.exports = ({
  instance,
  tableName,
  rowKeyDelineator,
  columnFamilyId,
  columnQualifier
}) => {
  // eslint-disable-next-line no-console
  console.log("ADDING: ", tableName, rowKeyDelineator);

  let table = instance.table(tableName);
  return async ({ event }) => {
    // eslint-disable-next-line no-console
    console.log("calling: ", event);
    const [tableExists] = await table.exists();
    if (!tableExists) await initializeTable(table, columnFamilyId);
    const [newTableExists] = await table.exists();
    // eslint-disable-next-line no-console
    console.log("sofarsogood", newTableExists);
    const row = {
      key: `${event.fact.root}${rowKeyDelineator}${event.fact.createdTimestamp}`,
      data: {
        [columnFamilyId]: {
          [columnQualifier]: JSON.stringify(event)
        }
      }
    };

    // eslint-disable-next-line no-console
    console.log("row: ", row);
    await table.insert(row);

    // eslint-disable-next-line no-console
    console.log("inserted: ");
    return row;
  };
};
