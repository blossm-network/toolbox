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

  table = await table.create(options);
  // eslint-disable-next-line no-console
  console.log("r wassup?: ", table);
};

module.exports = ({ instance, storeId, rowKeyDelineator }) => {
  // eslint-disable-next-line no-console
  console.log("ADDING: ", storeId, rowKeyDelineator);
  let table = instance.table(storeId);
  return async ({ event }) => {
    // eslint-disable-next-line no-console
    console.log("calling: ", event);
    if (!(await table.exists())) await initializeTable(table);
    // eslint-disable-next-line no-console
    console.log("sofarsogood", await table.exists());
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
