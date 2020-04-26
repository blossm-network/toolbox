const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const viewStore = require("..");

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const context = "some-context";
const network = "some-network";

const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

const query = "some-query";
const sort = "some-sort";
const view = "some-view";
const id = "some-id";
const contexts = { c: 2 };
const claims = "some-claims";

const envContext = "some-env-context";
process.env.CONTEXT = envContext;
process.env.NETWORK = network;

describe("Get views", () => {
  afterEach(() => {
    restore();
  });

  it("should call read with the correct params", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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

    const { body: result } = await viewStore({
      name,
      domain,
      service,
      context,
      network,
    })
      .set({
        context: contexts,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .read({ query, sort });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-store"
    );
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
    });
    expect(result).to.equal(views);
  });
  it("should call read with the correct params and optionals omitted", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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

    const result = await viewStore({ name }).read({
      query,
    });

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(getFake).to.have.been.calledWith({ query });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
    expect(result).to.deep.equal({ body: views });
  });
  it("should call read with the correct params onto other host", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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
    const { body: result } = await viewStore({
      name,
      context,
      network: otherNetwork,
    })
      .set({ context: contexts, tokenFns: { external: externalTokenFn } })
      .read({ query, sort });

    expect(rpcFake).to.have.been.calledWith(name, context, "view-store");
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({
      context: contexts,
      network: otherNetwork,
      host: "view.some-context.some-other-network",
    });
    expect(withFake).to.have.been.calledWith({
      externalTokenFn,
      path: "/some-name",
    });
    expect(result).to.equal(views);
  });
  it("should call stream with the correct params", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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
    const { body: result } = await viewStore({
      name,
      domain,
      service,
      context,
      network,
    })
      .set({
        context: contexts,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .stream({ query, sort }, fn);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-store"
    );
    expect(streamFake).to.have.been.calledWith({ query, sort }, fn);
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
      externalTokenFn,
    });
    expect(result).to.equal(views);
  });
  it("should call stream with the correct params and optionals omitted", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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
    const result = await viewStore({ name }).stream(
      {
        query,
      },
      fn
    );

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(streamFake).to.have.been.calledWith({ query }, fn);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
    });
    expect(result).to.deep.equal({ body: views });
  });
  it("should call stream with the correct params onto other host", async () => {
    const views = "some-views";
    const withFake = fake.returns({ body: views });
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

    const otherNetwork = "some-other-network";
    const fn = "some-fn";
    const { body: result } = await viewStore({
      name,
      domain,
      context,
      network: otherNetwork,
    })
      .set({ context: contexts, tokenFns: { external: externalTokenFn } })
      .stream({ query, sort }, fn);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      context,
      "view-store"
    );
    expect(streamFake).to.have.been.calledWith({ query, sort }, fn);
    expect(inFake).to.have.been.calledWith({
      context: contexts,
      network: otherNetwork,
      host: "v.some-domain.some-context.some-other-network",
    });
    expect(withFake).to.have.been.calledWith({
      path: "/some-name/stream",
      externalTokenFn,
    });
    expect(result).to.equal(views);
  });
  it("should call update with the correct params", async () => {
    const withFake = fake.returns({});
    const inFake = fake.returns({
      with: withFake,
    });
    const putFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      put: putFake,
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain, service, context })
      .set({
        context: contexts,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .update(id, view);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-store"
    );
    expect(putFake).to.have.been.calledWith(id, { view });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
    });
  });
  it("should call update with the correct params and optionals omitted", async () => {
    const withFake = fake.returns({});
    const inFake = fake.returns({
      with: withFake,
    });
    const putFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      put: putFake,
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name }).update(id, view);

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(putFake).to.have.been.calledWith(id, { view });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
  it("should call delete with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake,
    });
    const deleteFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      delete: deleteFake,
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain, service, context })
      .set({
        context: contexts,
        claims,
        tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      })
      .delete(id);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      "view-store"
    );
    expect(deleteFake).to.have.been.calledWith(id);
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      claims,
      internalTokenFn,
      externalTokenFn,
    });
  });
  it("should call delete with the correct params with optionals omitted", async () => {
    const withFake = fake.returns({});
    const inFake = fake.returns({
      with: withFake,
    });
    const deleteFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      delete: deleteFake,
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name }).delete(id);

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(deleteFake).to.have.been.calledWith(id);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
});
