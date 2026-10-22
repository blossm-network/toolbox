/* global BigInt */
import deps from "./deps.js";
import signingDomain from "./src/signing_domain.js";

const uint = (value, bits, name) => {
  const valid =
    typeof value === "bigint" ||
    (typeof value === "number" && Number.isSafeInteger(value)) ||
    (typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value));

  if (valid) {
    const number = BigInt(value);
    if (number >= BigInt(0) && number < BigInt(1) << BigInt(bits))
      return number;
  }

  throw deps.invalidArgument.message(
    `${name} must be an unsigned ${bits}-bit integer`
  );
};

const signErc2771ForwardRequest = async ({
  forwardRequestData,
  chainId,
  privateKey,
  rpcUrl,
  domainName,
  version,
  deadline,
} = {}) => {
  const forwarderAddress = deps.erc2771ForwarderContract(chainId);

  if (
    !forwardRequestData ||
    typeof forwardRequestData !== "object" ||
    Array.isArray(forwardRequestData)
  ) {
    throw deps.invalidArgument.message("forwardRequestData must be an object");
  }

  const { from, to, data } = forwardRequestData;
  if (
    typeof from !== "string" ||
    !deps.isAddress(from) ||
    typeof to !== "string" ||
    !deps.isAddress(to)
  ) {
    throw deps.invalidArgument.message(
      "Request addresses must be valid EVM addresses"
    );
  }
  if (!deps.isHex(data) || data.length % 2 !== 0) {
    throw deps.invalidArgument.message(
      "Request data must be even-length hex bytes"
    );
  }

  const request = {
    from,
    to,
    value: uint(forwardRequestData.value, 256, "value"),
    gas: uint(forwardRequestData.gas, 256, "gas"),
    deadline: uint(deadline, 48, "deadline"),
    data,
  };
  if (request.gas === BigInt(0) || request.deadline === BigInt(0)) {
    throw deps.invalidArgument.message(
      "gas and deadline must be greater than zero"
    );
  }

  let account;
  try {
    if (
      typeof privateKey !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(privateKey)
    ) {
      throw new Error("Invalid key format");
    }
    account = deps.privateKeyToAccount(privateKey);
  } catch {
    // Do not attach a key-parser cause that could include the secret input.
    throw deps.invalidArgument.message(
      "privateKey must be a valid secp256k1 key"
    );
  }
  if (from.toLowerCase() !== account.address.toLowerCase()) {
    throw deps.invalidArgument.message(
      "Request sender must match the signing account"
    );
  }

  const publicClient = deps.getProvider(rpcUrl);
  if ((await publicClient.getChainId()) !== chainId) {
    throw deps.internalServer.message(
      "RPC endpoint does not match the requested chain"
    );
  }

  const block = await publicClient.getBlock({ blockTag: "latest" });
  if (
    !block ||
    typeof block.number !== "bigint" ||
    typeof block.timestamp !== "bigint" ||
    block.number < BigInt(0) ||
    block.timestamp < BigInt(0)
  ) {
    throw deps.internalServer.message("Invalid chain block response");
  }
  if (request.deadline <= block.timestamp) {
    throw deps.invalidArgument.message(
      "deadline must be later than the latest block timestamp"
    );
  }

  const forwarder = deps.getContract({
    address: forwarderAddress,
    abi: deps.trustedForwarderContractABI,
    client: publicClient,
  });
  const domain = signingDomain({
    reportedDomain: await forwarder.read.eip712Domain([], {
      blockNumber: block.number,
    }),
    chainId,
    forwarderAddress,
    domainName,
    version,
  });

  const nonce = uint(
    await forwarder.read.nonces([account.address], {
      blockNumber: block.number,
    }),
    256,
    "nonce"
  );
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
