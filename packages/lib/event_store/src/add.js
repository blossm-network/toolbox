const column_family_id = "a";
const column_qualifier = "a";

const initializeTable = async table => {
  const options = {
    families: [
      {
        name: column_family_id
      }
    ]
  };

  // eslint-disable-next-line no-console
  console.log("bout to create");

  await table.create(options);
};

module.exports = ({ instance, tableName, rowKeyDelineator }) => {
  // eslint-disable-next-line no-console
  console.log("ADDING: ", tableName, rowKeyDelineator);

  let table = instance.table(tableName);
  return async ({ event }) => {
    // eslint-disable-next-line no-console
    console.log("calling: ", event);
    const [tableExists] = await table.exists();
    if (!tableExists) await initializeTable(table);
    const [newTableExists] = await table.exists();
    // eslint-disable-next-line no-console
    console.log("sofarsogood", newTableExists);
    const row = {
      key: `${event.fact.root}${rowKeyDelineator}${event.fact.createdTimestamp}`,
      data: {
        [column_family_id]: {
          [column_qualifier]: JSON.stringify(event)
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
