module.exports = async ({ store, query }) => await store.countDocuments(query);
