// Use the same complete network labels in generation and credential lookup.
export default (network) => network.toUpperCase().split(".").join("_");
