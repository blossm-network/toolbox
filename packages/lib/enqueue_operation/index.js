export default async ({ enqueueFn, url, data, method }) =>
  enqueueFn({
    url,
    data,
    ...(method && { method })
  });
