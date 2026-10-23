/* global BigInt */
import deps from "./deps.js";

const signErc2771ForwardRequest = async ({
  forwardRequestData: { from, to, value, gas, data },
  chainId,
  privateKey,
  rpcUrl,
  deadline,
}) => {
  const forwarderAddress = deps.erc2771ForwarderContract(chainId);

  const request = {
    from,
    to,
    value: BigInt(value),
    gas: BigInt(gas),
    deadline: BigInt(deadline),
    data,
  };
  let account;
  try {
    account = deps.privateKeyToAccount(privateKey);
  } catch {
    // Do not attach a key-parser cause that could include the secret input.
    throw deps.invalidArgument.message(
      "privateKey must be a valid secp256k1 key"
    );
  }
  const publicClient = deps.getProvider(rpcUrl);
  const forwarder = deps.getContract({
    address: forwarderAddress,
    abi: deps.trustedForwarderContractABI,
    client: publicClient,
  });
  const [, name, version, domainChainId, verifyingContract] =
    await forwarder.read.eip712Domain();
  if (domainChainId !== BigInt(chainId)) {
    throw deps.internalServer.message(
      "Forwarder domain does not match the requested chain"
    );
  }
  const domain = { name, version, chainId: domainChainId, verifyingContract };
  const nonce = await forwarder.read.nonces([account.address]);
  const types = {
    ForwardRequest: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint48" },
      { name: "data", type: "bytes" },
    ],
  };

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: "ForwardRequest",
    message: { ...request, nonce },
  });

  return deps.encodeFunctionData({
    abi: deps.trustedForwarderContractABI,
    functionName: "execute",
    args: [{ ...request, signature }],
  });
};

export default {
  signErc2771ForwardRequest,
};
