import deps from "./deps.js";

// Juicebox V6 deployments, pinned to deploy-all-v6 in README.md.
const erc2771ForwarderContract = (chainId) => {
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw deps.internalServer.message(
      "chainId must be a positive safe integer"
    );
  }

  const forwarders = {
    1: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Ethereum Mainnet
    10: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Optimism
    8453: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Base
    42161: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Arbitrum
    11155111: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Ethereum Sepolia
    84532: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Base Sepolia
    11155420: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Optimism Sepolia
    421614: "0x3ba60b60933916a7c87d0860dcee62a0ce34e3e2", // Arbitrum Sepolia
  };

  if (!Object.hasOwn(forwarders, chainId)) {
    throw deps.internalServer.message(`Unsupported chainId: ${chainId}`);
  }

  return forwarders[chainId];
};

export default {
  erc2771ForwarderContract,
};
