module.exports = async ({ store, query }) => await store.remove(query).exec();
