export default async ({ store, data, options = {} }) =>
  await store.insertMany([...(data instanceof Array ? data : [data])], options);
