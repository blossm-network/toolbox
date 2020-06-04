module.exports = ({ host, path = "", id }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${host}${path}${
    id != undefined ? `/${id}` : ""
  }`;
