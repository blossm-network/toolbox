/* global BigInt */
import deps from "../deps.js";

export default ({
  reportedDomain,
  chainId,
  forwarderAddress,
  domainName,
  version,
}) => {
  const [
    fields,
    name,
    domainVersion,
    domainChainId,
    verifyingContract,
    ,
    extensions,
  ] = reportedDomain;

  if (
    fields !== "0x0f" ||
    !Array.isArray(extensions) ||
    extensions.length !== 0 ||
    typeof name !== "string" ||
    !name ||
    typeof domainVersion !== "string" ||
    !domainVersion ||
    domainChainId !== BigInt(chainId) ||
    typeof verifyingContract !== "string" ||
    verifyingContract.toLowerCase() !== forwarderAddress.toLowerCase()
  ) {
    throw deps.internalServer.message("Unexpected forwarder signing domain");
  }
  if (
    (domainName !== undefined && domainName !== name) ||
    (version !== undefined && version !== domainVersion)
  ) {
    throw deps.invalidArgument.message(
      "Requested domain does not match the forwarder"
    );
  }

  return {
    name,
    version: domainVersion,
    chainId: domainChainId,
    verifyingContract,
  };
};
