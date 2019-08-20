module.exports = ({ table, rowKeyDelineator, root, from, to }) => {
  const filter = [
    {
      column: {
        // Only retrieve the most recent version of the cell.
        // There could be many versions of a cell if a client retried a request.
        cellLimit: 1
      }
    }
  ];

  const query = {
    ...(from == undefined && to == undefined && { prefix: root }),
    filter,
    ...(from != undefined && { start: `${root}${rowKeyDelineator}${from}` }),
    ...(to != undefined && { end: `${root}${rowKeyDelineator}${to}` })
  };

  // eslint-disable-next-line no-console
  console.log("query: ", query);

  return table.createReadStream(query);
};
