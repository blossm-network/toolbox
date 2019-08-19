const column_family_id = "a";
const column_qualifier = "a";

const createTable = async table => {
  const options = {
    families: [
      {
        name: column_family_id
      }
    ]
  };

  const r = await table.create(options);
  // eslint-disable-next-line no-console
  console.log("r wassup?: ", r);
};

module.exports = ({ instance, storeId, rowKeyDelineator }) => {
  // eslint-disable-next-line no-console
  console.log("ADDING: ", storeId, rowKeyDelineator);
  const table = instance.table(storeId);
  return async ({ event }) => {
    // eslint-disable-next-line no-console
    console.log("calling: ", event);
    const exi = await table.exists();
    // eslint-disable-next-line no-console
    console.log("sofarsogood but does it?: ", exi);
    if (!exi) await createTable(table);
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
