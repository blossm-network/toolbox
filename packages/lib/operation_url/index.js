import deps from "./deps.js";

export default ({ region, operationNameComponents, computeUrlId, host, path = "", id }) => {
  const operationName = deps.trim(`${operationNameComponents.slice().reverse().join("-")}`, deps.MAX_LENGTH)
  const hash = deps.hash(...operationNameComponents)
  if (process.env.NODE_ENV == "local") {
    return `http://${hash}.${host}${path}${id != undefined ? `/${id}` : ""}`;
  } else {
    return `https://${region}-${operationName}-${hash}-${computeUrlId}.${region}.run.app${path}${id != undefined ? `/${id}` : ""}`;
  }
}