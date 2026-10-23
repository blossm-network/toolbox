import { expect } from "chai";
import { createHash } from "crypto";

import contracts from "../index.js";

const { erc2771ForwarderContract } = contracts;

describe("Juicebox V6 forwarder addresses", () => {
  it("should match the pinned V6 deployment's eight chain/address records", () => {
    const chainIds = [1, 10, 8453, 42161, 84532, 421614, 11155111, 11155420];
    const records = chainIds.map((chainId) => [
      chainId,
      erc2771ForwarderContract(chainId),
    ]);

    for (const [, address] of records) {
      expect(address).to.match(/^0x[0-9a-f]{40}$/);
    }

    // Hash of source-derived, numerically sorted [chainId, lowercaseAddress] pairs.
    const hash = createHash("sha256")
      .update(JSON.stringify(records))
      .digest("hex");
    expect(hash).to.equal(
      "2529ebbf4c7a7855d1d91e210fa75630ba451aa0185790d54cd17e2778703932"
    );
  });

  it("should reject malformed chain IDs without coercing them", () => {
    for (const chainId of [
      undefined,
      null,
      "1",
      "toString",
      "constructor",
      "__proto__",
      [1],
      {},
      { valueOf: () => 1 },
      { toString: () => "1" },
      Symbol("chain"),
      true,
      false,
      0,
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() => erc2771ForwarderContract(chainId))
        .to.throw("chainId must be a positive safe integer")
        .with.property("statusCode", 500);
    }
  });

  it("should reject unsupported numeric chain IDs with the shared error", () => {
    for (const chainId of [137, 999, Number.MAX_SAFE_INTEGER]) {
      expect(() => erc2771ForwarderContract(chainId))
        .to.throw(`Unsupported chainId: ${chainId}`)
        .with.property("statusCode", 500);
    }
  });

  it("should reject numeric entries inherited from Object.prototype", () => {
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, "999");
    Object.defineProperty(Object.prototype, "999", {
      value: "0x1111111111111111111111111111111111111111",
      configurable: true,
    });

    try {
      expect(() => erc2771ForwarderContract(999))
        .to.throw("Unsupported chainId: 999")
        .with.property("statusCode", 500);
    } finally {
      if (previous) {
        Object.defineProperty(Object.prototype, "999", previous);
      } else {
        delete Object.prototype[999];
      }
    }
  });
});
