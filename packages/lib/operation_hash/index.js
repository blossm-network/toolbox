import deps from "./deps.js";

export default (...operation) => deps.hash(operation.join("")).toString();
