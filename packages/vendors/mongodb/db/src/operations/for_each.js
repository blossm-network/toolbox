module.exports = async ({ store, query, fn }) => {
  return await new Promise((resolve, reject) => {
    store
      .find(query)
      .cursor()
      .on("data", (doc) => fn(doc))
      .on("error", (err) => reject(err))
      .on("end", () => resolve());
  });
};
