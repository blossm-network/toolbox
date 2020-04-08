module.exports = ({ host, path = "", id }) =>
  `https://${host}${path}${id != undefined ? `/${id}` : ""}`;
