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

  await table.create(options);
};

module.exports = ({ instance, storeId, rowKeyDelineator }) => {
  const table = instance.table(storeId);
  return async ({ event }) => {
    if (!(await table.exists())) await createTable(table);

    const row = {
      key: `${event.fact.root}${rowKeyDelineator}${event.fact.timestamp}`,
      data: {
        [column_family_id]: {
          [column_qualifier]: JSON.stringify(event)
        }
      }
    };

    await table.insert(row);

    return row;
  };
};
