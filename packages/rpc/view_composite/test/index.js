const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const viewComposite = require("..");

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const context = "some-context";

const internalTokenFn = "some-internal-token-fn";

const query = "some-query";
const sort = "some-sort";
const contexts = { c: 2 };

const envContext = "some-env-context";
process.env.CONTEXT = envContext;

describe("Get composite views", () => {
  afterEach(() => {
    restore();
  });

  it("should call read with the correct params", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
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

    const { body: result } = await viewComposite({
      name,
      domain,
      service,
      context,
    })
      .set({
        context: contexts,
        tokenFns: { internal: internalTokenFn },
      })
      .read({ query, sort });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-composite"
    );
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
    });
    expect(result).to.equal(view);
  });
  it("should call read with the correct params and optionals omitted", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
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

    const result = await viewComposite({ name }).read({ query });

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-composite");
    expect(getFake).to.have.been.calledWith({ query });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
    expect(result).to.deep.equal({ body: view });
  });
  it("should call stream with the correct params", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const { body: result } = await viewComposite({
      name,
      domain,
      service,
      context,
    })
      .set({
        context: contexts,
        tokenFns: { internal: internalTokenFn },
      })
      .stream({ query, sort }, fn);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-composite"
    );
    expect(streamFake).to.have.been.calledWith({ query, sort }, fn);
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
    });
    expect(result).to.equal(view);
  });
  it("should call stream with the correct params and optionals omitted", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const result = await viewComposite({ name }).stream(
      {
        query,
      },
      fn
    );

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-composite");
    expect(streamFake).to.have.been.calledWith({ query }, fn);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
    });
    expect(result).to.deep.equal({ body: view });
  });
});
