import queryString from "qs";

export default (url, params) => {
  if (params == undefined) return url;
  const query = queryString.stringify(params);
  if (!query) return url;

  const hashIndex = url.indexOf("#");
  const base = hashIndex < 0 ? url : url.substring(0, hashIndex);
  const fragment = hashIndex < 0 ? "" : url.substring(hashIndex);
  const separator = base.includes("?") ? (/[?&]$/.test(base) ? "" : "&") : "?";
  return `${base}${separator}${query}${fragment}`;
};
