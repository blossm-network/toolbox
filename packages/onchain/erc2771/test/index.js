/* global BigInt */
import assert from "assert";
import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  recoverTypedDataAddress,
  verifyTypedData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import deps from "../deps.js";
import erc2771 from "../index.js";

const abi = deps.trustedForwarderContractABI;
const privateKey = `0x${"11".repeat(32)}`; // Synthetic test key only.
const account = privateKeyToAccount(privateKey);
const forwarder = deps.erc2771ForwarderContract(1);
const types = {
  // Independent reference: pinned ERC2771Forwarder ForwardRequest type hash.
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
const request = {
  from: account.address,
  to: "0x2222222222222222222222222222222222222222",
  value: "7",
  gas: "100000",
  data: "0x1234",
};
const baseOptions = {
  forwardRequestData: request,
  chainId: 1,
  privateKey,
  rpcUrl: "https://rpc.example.test",
  deadline: 2000001000,
};

const rejection = async (options, message, statusCode = 409) =>
  assert.rejects(erc2771.signErc2771ForwardRequest(options), (error) => {
    expect(error.message).to.include(message);
    expect(error.statusCode).to.equal(statusCode);
    return true;
  });

describe("V6 ERC-2771 signing", () => {
  let state;
  let rpc;
  let getProvider;

  beforeEach(() => {
    state = {
      chainId: 1,
      number: "0x1234",
      timestamp: "0x77359400", // 2000000000, independent of local wall clock.
      domain: [
        "0x0f",
        "Juicebox",
        "1",
        BigInt(1),
        forwarder,
        `0x${"00".repeat(32)}`,
        [],
      ],
      nonce: BigInt(42),
      reads: [],
    };
    rpc = fake(async ({ method, params }) => {
      if (state.fail === method) throw new Error("Mock RPC unavailable");
      if (method === "eth_chainId") return `0x${state.chainId.toString(16)}`;
      if (method === "eth_getBlockByNumber") {
        return {
          number: state.number,
          timestamp: state.timestamp,
          transactions: [],
        };
      }
      if (method === "eth_call") {
        expect(params[0].to.toLowerCase()).to.equal(forwarder);
        const call = decodeFunctionData({ abi, data: params[0].data });
        state.reads.push({ ...call, block: params[1] });
        if (state.fail === call.functionName)
          throw new Error("Mock RPC unavailable");
        return encodeFunctionResult({
          abi,
          functionName: call.functionName,
          result: call.functionName === "nonces" ? state.nonce : state.domain,
        });
      }
      throw new Error(`Unexpected RPC method: ${method}`);
    });
    const client = createPublicClient({
      transport: custom({ request: rpc }, { retryCount: 0 }),
    });
    getProvider = fake.returns(client);
    replace(deps, "getProvider", getProvider);
  });

  afterEach(() => {
    try {
      for (const call of rpc.getCalls()) {
        expect(JSON.stringify(call.args)).to.not.include(privateKey);
        expect(["eth_chainId", "eth_getBlockByNumber", "eth_call"]).to.include(
          call.args[0].method
        );
      }
    } finally {
      restore();
    }
  });

  it("should sign locally, encode execute and recover the sender on each requested chain", async () => {
    const signatures = [];
    for (const chainId of [1, 8453]) {
      state.chainId = chainId;
      state.domain[3] = BigInt(chainId);
      const encoded = await erc2771.signErc2771ForwardRequest({
        ...baseOptions,
        chainId,
      });
      const decoded = decodeFunctionData({ abi, data: encoded });
      const { signature, ...forwardRequest } = decoded.args[0];
      signatures.push(signature);

      expect(decoded.functionName).to.equal("execute");
      expect(forwardRequest).to.deep.equal({
        ...request,
        value: BigInt(7),
        gas: BigInt(100000),
        deadline: baseOptions.deadline,
      });
      expect(forwardRequest).to.not.have.property("nonce");
      const typed = {
        domain: {
          name: "Juicebox",
          version: "1",
          chainId: BigInt(chainId),
          verifyingContract: forwarder,
        },
        types,
        primaryType: "ForwardRequest",
        message: { ...forwardRequest, nonce: state.nonce },
        signature,
      };
      expect(await recoverTypedDataAddress(typed)).to.equal(account.address);
      expect(
        await verifyTypedData({ ...typed, address: account.address })
      ).to.equal(true);
      expect(
        await verifyTypedData({
          ...typed,
          domain: {
            ...typed.domain,
            chainId: BigInt(chainId === 1 ? 8453 : 1),
          },
          address: account.address,
        })
      ).to.equal(false);
    }

    expect(signatures[0]).to.not.equal(signatures[1]);
    expect(state.reads.every((read) => read.block === state.number)).to.equal(
      true
    );
    expect(
      state.reads
        .filter((read) => read.functionName === "nonces")
        .every((read) => read.args[0] === account.address)
    ).to.equal(true);
    expect(getProvider.getCall(0).args).to.deep.equal([baseOptions.rpcUrl]);
  });

  it("should accept matching optional domain expectations and ignore caller nonce/signature overrides", async () => {
    state.nonce = BigInt("9007199254740993");
    const encoded = await erc2771.signErc2771ForwardRequest({
      ...baseOptions,
      domainName: "Juicebox",
      version: "1",
      forwardRequestData: {
        ...request,
        nonce: "0",
        signature: "0x00",
        deadline: 0,
      },
    });
    const { signature, ...forwardRequest } = decodeFunctionData({
      abi,
      data: encoded,
    }).args[0];
    expect(forwardRequest.deadline).to.equal(baseOptions.deadline);
    expect(
      await recoverTypedDataAddress({
        domain: {
          name: "Juicebox",
          version: "1",
          chainId: BigInt(1),
          verifyingContract: forwarder,
        },
        types,
        primaryType: "ForwardRequest",
        message: { ...forwardRequest, nonce: state.nonce },
        signature,
      })
    ).to.equal(account.address);
  });

  it("should preserve exact bigint values at the unsigned integer boundaries", async () => {
    const value = (BigInt(1) << BigInt(256)) - BigInt(1);
    const deadline = (BigInt(1) << BigInt(48)) - BigInt(1);
    const encoded = await erc2771.signErc2771ForwardRequest({
      ...baseOptions,
      deadline,
      forwardRequestData: { ...request, value, gas: BigInt(1) },
    });
    const decoded = decodeFunctionData({ abi, data: encoded }).args[0];
    expect(decoded.value).to.equal(value);
    expect(decoded.gas).to.equal(BigInt(1));
    expect(decoded.deadline).to.equal(Number(deadline));
  });

  it("should reject a sender that does not match the key before any RPC", async () => {
    await rejection(
      { ...baseOptions, forwardRequestData: { ...request, from: request.to } },
      "Request sender must match the signing account"
    );
    expect(rpc.callCount).to.equal(0);
  });

  it("should reject malformed requests and numeric inputs before any RPC", async () => {
    for (const forwardRequestData of [undefined, null, [], "request"]) {
      await rejection(
        { ...baseOptions, forwardRequestData },
        "forwardRequestData must be an object"
      );
    }
    for (const update of [
      { from: "invalid" },
      { to: "invalid" },
      { data: "0x0" },
      { data: "0xzz" },
      { data: undefined },
      { value: true },
      { value: {} },
      { value: [1] },
      { value: "01" },
      { value: "1.5" },
      { value: -1 },
      { value: Number.MAX_SAFE_INTEGER + 1 },
      { value: BigInt(1) << BigInt(256) },
      { gas: undefined },
      { gas: 0 },
      { gas: -1 },
    ]) {
      await assert.rejects(
        erc2771.signErc2771ForwardRequest({
          ...baseOptions,
          forwardRequestData: { ...request, ...update },
        }),
        (error) => error.statusCode === 409
      );
    }
    for (const deadline of [
      undefined,
      false,
      0,
      -1,
      1.5,
      BigInt(1) << BigInt(48),
    ]) {
      await assert.rejects(
        erc2771.signErc2771ForwardRequest({ ...baseOptions, deadline }),
        (error) => error.statusCode === 409
      );
    }
    expect(rpc.callCount).to.equal(0);
  });

  it("should reject malformed keys and sanitize key-parser failures", async () => {
    for (const key of [
      undefined,
      1,
      "0x1234",
      `0x${"00".repeat(32)}`,
      `0x${"ff".repeat(32)}`,
    ]) {
      await rejection(
        { ...baseOptions, privateKey: key },
        "privateKey must be a valid secp256k1 key"
      );
    }
    replace(deps, "privateKeyToAccount", fake.throws(new Error(privateKey)));
    await assert.rejects(
      erc2771.signErc2771ForwardRequest(baseOptions),
      (error) => {
        expect(JSON.stringify(error)).to.not.include(privateKey);
        expect(error.message).to.equal(
          "privateKey must be a valid secp256k1 key"
        );
        expect(error.cause()).to.equal(undefined);
        return true;
      }
    );
    expect(rpc.callCount).to.equal(0);
  });

  it("should reject unsupported chains before any RPC", async () => {
    for (const chainId of ["1", 137, 0]) {
      await assert.rejects(
        erc2771.signErc2771ForwardRequest({ ...baseOptions, chainId }),
        (error) => error.statusCode === 500
      );
    }
    expect(rpc.callCount).to.equal(0);
  });

  it("should reject an RPC chain mismatch before reading the forwarder", async () => {
    state.chainId = 10;
    await rejection(
      baseOptions,
      "RPC endpoint does not match the requested chain",
      500
    );
    expect(state.reads).to.deep.equal([]);
  });

  it("should reject expired deadlines using block time instead of wall-clock time", async () => {
    for (const deadline of [1999999999, 2000000000]) {
      await rejection(
        { ...baseOptions, deadline },
        "deadline must be later than the latest block timestamp"
      );
    }
    expect(state.reads).to.deep.equal([]);
  });

  it("should reject malformed block evidence", async () => {
    state.number = null;
    await rejection(baseOptions, "Invalid chain block response", 500);
    expect(state.reads).to.deep.equal([]);
  });

  it("should reject wrong or unsupported reported domains before reading a nonce", async () => {
    const valid = [...state.domain];
    for (const [index, value] of [
      [0, "0x07"],
      [0, "0x1f"],
      [1, ""],
      [2, ""],
      [3, BigInt(10)],
      [4, request.to],
      [6, [BigInt(1)]],
    ]) {
      state.domain = [...valid];
      state.domain[index] = value;
      await rejection(baseOptions, "Unexpected forwarder signing domain", 500);
    }
    expect(state.reads.some((read) => read.functionName === "nonces")).to.equal(
      false
    );
  });

  it("should reject caller expectations that disagree with the actual domain", async () => {
    for (const options of [{ domainName: "Blossm" }, { version: "2" }]) {
      await rejection(
        { ...baseOptions, ...options },
        "Requested domain does not match the forwarder"
      );
    }
    expect(state.reads.some((read) => read.functionName === "nonces")).to.equal(
      false
    );
  });

  it("should propagate failed public reads without signing or submitting", async () => {
    for (const fail of [
      "eth_chainId",
      "eth_getBlockByNumber",
      "eip712Domain",
      "nonces",
    ]) {
      state.fail = fail;
      await assert.rejects(
        erc2771.signErc2771ForwardRequest(baseOptions),
        /Mock RPC unavailable/
      );
    }
  });
});
