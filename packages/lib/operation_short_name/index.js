import deps from "./deps.js";
import { MAX_LENGTH } from "@blossm/service-name-consts";

export default (operationNameComponents) =>
  deps.trim(
    `${operationNameComponents.filter((c) => c != null).slice().reverse().join("-")}`,
    MAX_LENGTH
  );
