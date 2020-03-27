module.exports = ({ host, path = "", root }) =>
  `https://${host}${path}${root != undefined ? `/${root}` : ""}`;
