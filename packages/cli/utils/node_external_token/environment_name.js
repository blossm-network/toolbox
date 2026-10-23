// Use the complete network identity so configured peers cannot share credentials.
export default (network) => network.toUpperCase().split(".").join("_");
