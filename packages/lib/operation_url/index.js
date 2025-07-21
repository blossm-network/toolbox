import deps from "./deps.js";

export default ({ region, operationNameComponents, computeUrlId, path = "", id }) => {
  const operationName = deps.trim(`${operationNameComponents.slice().reverse().join("-")}`, deps.MAX_LENGTH)
  return `${process.env.NODE_ENV == "local" ? "http" : "https"}://${region}-${operationName}-${deps.hash(...operationNameComponents)}-${computeUrlId}.${region}.run.app${path}${id != undefined ? `/${id}` : ""}`;
}