import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake, replace } from "sinon";

import deps from "../deps.js";
import providers from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

describe("Onchain providers", () => {
  afterEach(restore);

  it("should pass the explicit URL and transport through and return the client", () => {
    const rpcUrl = "https://rpc.example.test/path?key=example";
    const transport = {};
    const client = {};
    const httpFake = fake.returns(transport);
    const createPublicClientFake = fake.returns(client);

    replace(deps, "http", httpFake);
    replace(deps, "createPublicClient", createPublicClientFake);

    expect(providers.getProvider(rpcUrl)).to.equal(client);
    expect(httpFake).to.have.been.calledOnceWithExactly(rpcUrl);
    expect(createPublicClientFake).to.have.been.calledOnceWithExactly({
      transport,
    });
  });

  it("should construct real HTTP and HTTPS public clients without making RPC calls", () => {
    for (const rpcUrl of [
      "http://127.0.0.1:1",
      "https://rpc.example.test/path?key=example",
    ]) {
      const client = providers.getProvider(rpcUrl);

      expect(client.type).to.equal("publicClient");
      expect(client.transport.type).to.equal("http");
      expect(client.transport.url).to.equal(rpcUrl);
      expect(client.getChainId).to.be.a("function");
      expect(client.readContract).to.be.a("function");
      expect(client.waitForTransactionReceipt).to.be.a("function");
    }
  });

  it("should reject missing URLs with the shared configuration error", () => {
    const httpFake = fake();
    const createPublicClientFake = fake();
    replace(deps, "http", httpFake);
    replace(deps, "createPublicClient", createPublicClientFake);

    for (const rpcUrl of [undefined, null, ""]) {
      expect(() => providers.getProvider(rpcUrl))
        .to.throw("rpcUrl is required")
        .with.property("statusCode", 500);
    }

    expect(httpFake).to.not.have.been.called;
    expect(createPublicClientFake).to.not.have.been.called;
  });

  it("should reject malformed URLs, non-strings and unsupported transports", () => {
    const httpFake = fake();
    const createPublicClientFake = fake();
    replace(deps, "http", httpFake);
    replace(deps, "createPublicClient", createPublicClientFake);

    for (const rpcUrl of [
      0,
      42,
      false,
      true,
      {},
      ["https://rpc.example.test"],
      " ",
      "not-a-url",
      "/rpc",
      "https://",
      "ftp://rpc.example.test",
      "ws://rpc.example.test",
      "wss://rpc.example.test",
    ]) {
      expect(() => providers.getProvider(rpcUrl))
        .to.throw("rpcUrl must be an absolute HTTP or HTTPS URL")
        .with.property("statusCode", 500);
    }

    expect(httpFake).to.not.have.been.called;
    expect(createPublicClientFake).to.not.have.been.called;
  });

  it("should propagate transport construction failures unchanged", () => {
    const error = new Error("Transport construction failed");
    const createPublicClientFake = fake();
    replace(deps, "http", fake.throws(error));
    replace(deps, "createPublicClient", createPublicClientFake);

    expect(() => providers.getProvider("https://rpc.example.test")).to.throw(
      error
    );
    expect(createPublicClientFake).to.not.have.been.called;
  });

  it("should propagate client construction failures unchanged", () => {
    const error = new Error("Client construction failed");
    replace(deps, "http", fake.returns({}));
    replace(deps, "createPublicClient", fake.throws(error));

    expect(() => providers.getProvider("https://rpc.example.test")).to.throw(
      error
    );
  });
});
