/* global BigInt */
import { expect } from "chai";
import { createHash } from "crypto";
import {
  decodeAbiParameters,
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
} from "viem";

import abis from "../index.js";

const abi = abis.trustedForwarderContractABI;
const request = {
  from: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  value: BigInt(7),
  gas: BigInt(100000),
  deadline: 2000000000,
  data: "0x1234",
  signature: `0x${"33".repeat(65)}`,
};

describe("Trusted forwarder ABI", () => {
  it("should match the pinned OpenZeppelin 5.4.0 artifact ABI exactly", () => {
    // Ignore top-level entry order, preserving exact entry and tuple contents.
    const entries = abi
      .map((entry) => JSON.stringify(entry))
      .sort()
      .join("\n");
    const hash = createHash("sha256").update(entries).digest("hex");
    expect(hash).to.equal(
      "0bb81fff2d9988faf96902ab3910e3af3ca306a40c1baebb8d19a1f262a59f0b"
    );
  });

  it("should encode and decode the exact execute request tuple", () => {
    const data = encodeFunctionData({
      abi,
      functionName: "execute",
      args: [request],
    });

    expect(data.slice(0, 10)).to.equal("0xdf905caf");
    expect(decodeFunctionData({ abi, data })).to.deep.equal({
      functionName: "execute",
      args: [request],
    });
  });

  it("should encode and decode batch requests and the refund receiver", () => {
    const second = { ...request, value: BigInt(9), data: "0x" };
    const data = encodeFunctionData({
      abi,
      functionName: "executeBatch",
      args: [[request, second], request.from],
    });

    expect(data.slice(0, 10)).to.equal("0xccf96b4a");
    expect(decodeFunctionData({ abi, data })).to.deep.equal({
      functionName: "executeBatch",
      args: [[request, second], request.from],
    });
  });

  it("should encode view calls and decode nonce, verification and domain results", () => {
    const nonceCall = encodeFunctionData({
      abi,
      functionName: "nonces",
      args: [request.from],
    });
    expect(nonceCall.slice(0, 10)).to.equal("0x7ecebe00");
    const nonceResult = encodeAbiParameters(
      [{ type: "uint256" }],
      [BigInt(42)]
    );
    expect(
      decodeFunctionResult({ abi, functionName: "nonces", data: nonceResult })
    ).to.equal(BigInt(42));

    const verifyCall = encodeFunctionData({
      abi,
      functionName: "verify",
      args: [request],
    });
    expect(verifyCall.slice(0, 10)).to.equal("0x19d8d38c");
    for (const valid of [true, false]) {
      const data = encodeAbiParameters([{ type: "bool" }], [valid]);
      expect(
        decodeFunctionResult({ abi, functionName: "verify", data })
      ).to.equal(valid);
    }

    expect(encodeFunctionData({ abi, functionName: "eip712Domain" })).to.equal(
      "0x84b0196e"
    );
    const types = [
      { type: "bytes1" },
      { type: "string" },
      { type: "string" },
      { type: "uint256" },
      { type: "address" },
      { type: "bytes32" },
      { type: "uint256[]" },
    ];
    const values = [
      "0x0f",
      "Example",
      "1",
      BigInt(1),
      request.to,
      `0x${"00".repeat(32)}`,
      [BigInt(7)],
    ];
    const data = encodeAbiParameters(types, values);
    expect(
      decodeFunctionResult({ abi, functionName: "eip712Domain", data })
    ).to.deep.equal(decodeAbiParameters(types, data));
  });

  it("should decode execution events with indexed signer and success flag", () => {
    const data = encodeAbiParameters(
      [{ type: "uint256" }, { type: "bool" }],
      [BigInt(42), false]
    );
    const decoded = decodeEventLog({
      abi,
      data,
      topics: [
        "0x842fb24a83793558587a3dab2be7674da4a51d09c5542d6dd354e5d0ea70813c",
        `0x${request.from.slice(2).padStart(64, "0")}`,
      ],
    });

    expect(decoded.eventName).to.equal("ExecutedForwardRequest");
    expect(decoded.args).to.deep.equal({
      signer: request.from,
      nonce: BigInt(42),
      success: false,
    });
  });

  it("should decode the upstream expired-request revert payload", () => {
    const payload = encodeAbiParameters(
      [{ type: "uint48" }],
      [request.deadline]
    );
    const decoded = decodeErrorResult({
      abi,
      data: `0x94eef58a${payload.slice(2)}`,
    });

    expect(decoded.errorName).to.equal("ERC2771ForwarderExpiredRequest");
    expect(decoded.args).to.deep.equal([request.deadline]);
  });
});
