import deps from "../deps.js";
import { joseFormat } from "./format.js";

export default (
  value,
  { format = typeof value == "number" ? "jose" : "legacy" } = {}
) => {
  const timestamp = joseFormat(format)
    ? typeof value == "number"
      ? value * 1000
      : NaN
    : typeof value == "string"
    ? Date.parse(value)
    : NaN;
  if (!Number.isFinite(timestamp))
    throw deps.invalidCredentialsError.message(
      "The token time claim is invalid."
    );
  return timestamp;
};
