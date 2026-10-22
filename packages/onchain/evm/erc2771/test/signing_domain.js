/* global BigInt */
import assert from "assert";
import { expect } from "chai";
import signingDomain from "../src/signing_domain.js";

const address = `0x${"22".repeat(20)}`;
const reportedDomain = [
  "0x0f",
  "Juicebox",
  "1",
  BigInt(8453),
  address,
  `0x${"00".repeat(32)}`,
  [],
];
const options = { reportedDomain, chainId: 8453, forwarderAddress: address };

describe("ERC-2771 signing domain", () => {
  it("uses the reported domain and treats caller name/version as optional expectations", () => {
    const expected = {
      name: "Juicebox",
      version: "1",
      chainId: BigInt(8453),
      verifyingContract: address,
    };
    expect(signingDomain(options)).to.deep.equal(expected);
    expect(
      signingDomain({ ...options, domainName: "Juicebox", version: "1" })
    ).to.deep.equal(expected);
  });

  it("rejects unsupported fields, extensions, chain or verifying contract", () => {
    for (const [index, value] of [
      [0, "0x07"],
      [0, "0x1f"],
      [1, ""],
      [2, ""],
      [3, BigInt(1)],
      [4, `0x${"33".repeat(20)}`],
      [6, [BigInt(1)]],
    ]) {
      const domain = [...reportedDomain];
      domain[index] = value;
      assert.throws(
        () => signingDomain({ ...options, reportedDomain: domain }),
        (error) =>
          error.statusCode === 500 &&
          error.message === "Unexpected forwarder signing domain"
      );
    }
  });

  it("rejects mismatching caller expectations without overriding the reported domain", () => {
    for (const expected of [{ domainName: "Blossm" }, { version: "2" }]) {
      assert.throws(
        () => signingDomain({ ...options, ...expected }),
        (error) =>
          error.statusCode === 409 &&
          error.message === "Requested domain does not match the forwarder"
      );
    }
  });
});
