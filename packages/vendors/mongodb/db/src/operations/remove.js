export default ({ store, query, options }) =>
  store.deleteOne(query, ...(options ? [options] : []));
