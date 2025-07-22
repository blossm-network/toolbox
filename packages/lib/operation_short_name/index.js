import deps from "./deps.js";
import { MAX_LENGTH } from "@blossm/service-name-consts";

export default (operationNameComponents) =>
  deps.trim(`${operationNameComponents.slice().reverse().join("-")}`, MAX_LENGTH);
