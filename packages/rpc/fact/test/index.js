const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const deps = require("../deps");
const fact = require("..");

let clock;

const now = new Date();

const name = "some-name";
const domain = "some-domain";
const service = "some-service";

const query = { a: 1 };
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

const context = { c: 2 };
const claims = "some-claims";

const envService = "some-env-service";

process.env.SERVICE = envService;

describe("Get job", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call read with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const { body: result } = await fact({ name, domain, service })
      .set({
        context,
        claims,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .read(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "fact");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      claims,
    });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await fact({ name }).read();

    expect(result).to.deep.equal({ body: response });
    expect(rpcFake).to.have.been.calledWith(name, envService, "fact");
    expect(getFake).to.have.been.calledWith({});
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });
  it("should call with the correct params with root", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const root = "some-root";
    const result = await fact({ name }).read({ root });

    expect(result).to.deep.equal({ body: response });
    expect(rpcFake).to.have.been.calledWith(name, envService, "fact");
    expect(getFake).to.have.been.calledWith({ id: root });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });
  it("should call read with the correct params onto a different network", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);
    const otherNetwork = "some-other-network";
    const { body: result } = await fact({
      name,
      domain,
      service,
      network: otherNetwork,
    })
      .set({
        context,
        claims,
        tokenFns: { external: externalTokenFn },
      })
      .read(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "fact");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
      network: otherNetwork,
      host: `fact.some-domain.some-service.some-other-network`,
    });
    expect(withFake).to.have.been.calledWith({
      externalTokenFn,
      claims,
    });
  });
  it("should call stream with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const { body: result } = await fact({ name, domain, service })
      .set({
        context,
        claims,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .stream(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "fact");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
      externalTokenFn,
      claims,
    });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await fact({ name }).stream(query);

    expect(result).to.deep.equal({ body: response });
    expect(rpcFake).to.have.been.calledWith(name, envService, "fact");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({ path: "/stream" });
  });
  it("should call stream with the correct params with root", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const root = "some-root";
    const { body: result } = await fact({ name, domain, service })
      .set({
        context,
        claims,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .stream({ root });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "fact");
    expect(getFake).to.have.been.calledWith({ id: root });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
      externalTokenFn,
      claims,
    });
  });
  it("should call stream with the correct params onto different network", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const otherNetwork = "some-other-network";
    const { body: result } = await fact({
      name,
      domain,
      service,
      network: otherNetwork,
    })
      .set({
        context,
        claims,
        tokenFns: { external: externalTokenFn },
      })
      .stream(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "fact");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
      network: otherNetwork,
      host: `fact.some-domain.some-service.some-other-network`,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      externalTokenFn,
      claims,
    });
  });
});
