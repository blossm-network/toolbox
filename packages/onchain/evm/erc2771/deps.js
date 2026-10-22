import { encodeFunctionData, getContract, isAddress, isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import contracts from "@blossm/contract-addresses-trusted-forwarder";
import abis from "@blossm/contract-abis-trusted-forwarder";
import providers from "@blossm/providers";
import { internalServer, invalidArgument } from "@blossm/errors";

export default {
  privateKeyToAccount,
  encodeFunctionData,
  getContract,
  isAddress,
  isHex,
  erc2771ForwarderContract: contracts.erc2771ForwarderContract,
  trustedForwarderContractABI: abis.trustedForwarderContractABI,
  getProvider: providers.getProvider,
  internalServer,
  invalidArgument,
};
