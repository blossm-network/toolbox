import deps from "./deps.js";

export default ({ operation, host, path = "", id }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash(
    ...operation
  )}.${host}${path}${id != undefined ? `/${id}` : ""}`;
