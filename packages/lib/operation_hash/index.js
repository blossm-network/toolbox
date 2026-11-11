import deps from "./deps.js";

// Component types and boundaries are part of the shared deployment/RPC identity.
export default (...operation) =>
  deps
    .hash(JSON.stringify(operation.map((part) => [typeof part, part])))
    .toString();
