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
        expect(call.args[0].method).to.equal("eth_call");
      }
    } finally {
      restore();
    }
  });

  it("should sign locally, encode execute and recover the sender on each requested chain", async () => {
    const signatures = [];
    for (const chainId of [1, 8453]) {
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
    expect(state.reads.every((read) => read.block === "latest")).to.equal(true);
    expect(
      state.reads
        .filter((read) => read.functionName === "nonces")
        .every((read) => read.args[0] === account.address)
    ).to.equal(true);
    expect(getProvider.getCall(0).args).to.deep.equal([baseOptions.rpcUrl]);
  });

  it("should use the reported domain and nonce and ignore caller overrides", async () => {
    state.nonce = BigInt("9007199254740993");
    state.domain[1] = "Reported forwarder";
    state.domain[2] = "2";
    state.domain[4] = request.to;
    const encoded = await erc2771.signErc2771ForwardRequest({
      ...baseOptions,
      domainName: "Ignored legacy expectation",
      version: "Ignored legacy expectation",
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
          name: state.domain[1],
          version: state.domain[2],
          chainId: BigInt(1),
          verifyingContract: state.domain[4],
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

  it("should redact key-parser failures without leaking the secret", async () => {
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

  it("should reject a reported domain chain mismatch before reading the nonce", async () => {
    state.domain[3] = BigInt(10);
    await rejection(
      baseOptions,
      "Forwarder domain does not match the requested chain",
      500
    );
    expect(state.reads.map((read) => read.functionName)).to.deep.equal([
      "eip712Domain",
    ]);
  });

  it("should propagate failed public reads without signing or submitting", async () => {
    for (const fail of ["eip712Domain", "nonces"]) {
      state.fail = fail;
      await assert.rejects(
        erc2771.signErc2771ForwardRequest(baseOptions),
        /Mock RPC unavailable/
      );
    }
  });
});
