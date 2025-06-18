import queryString from "qs";

export default (url, params) =>
  params == undefined ? url : `${url}?${queryString.stringify(params)}`;
