import deps from "./deps.js";

const version = () => {
  const value = process.env.OPERATION_IDENTITY_VERSION ?? "1";
  if (value != "1" && value != "2")
    throw new Error(`Unsupported operation identity version: ${value}`);
  return value;
};

// The generator carries this same selection into the deployed RPC clients.
export const environment = () => ({ OPERATION_IDENTITY_VERSION: version() });

export default (...operation) => version() == "1"
  ? deps.hash(operation.join("")).toString()
  : `v2-${deps.hash(JSON.stringify(operation.map(part => [typeof part, part])))}`;
