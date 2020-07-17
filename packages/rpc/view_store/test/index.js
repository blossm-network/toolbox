const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const viewStore = require("..");

const name = "some-name";
const context = "some-context";
const network = "some-network";

const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";
const currentToken = "some-current-token";
const key = "some-key";

const query = "some-query";
const sort = "some-sort";
const root = "some-root";
const contexts = { c: 2 };

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
      context,
      network,
    })
      .set({
        context: contexts,
        currentToken,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .read({ query, sort, root });

    expect(rpcFake).to.have.been.calledWith(name, context, "view-store");
    expect(getFake).to.have.been.calledWith({ query, sort, id: root });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      currentToken,
      key,
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

    const result = await viewStore({ name }).read();

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(getFake).to.have.been.calledWith();
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
      .set({ context: contexts, token: { externalFn: externalTokenFn, key } })
      .read({ query, sort });

    expect(rpcFake).to.have.been.calledWith(name, context, "view-store");
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({
      context: contexts,
      network: otherNetwork,
      host: "v.some-context.some-other-network",
    });
    expect(withFake).to.have.been.calledWith({
      externalTokenFn,
      key,
      path: "/some-name",
    });
    expect(result).to.equal(views);
  });
  // it("should call stream with the correct params", async () => {
  //   const views = "some-views";
  //   const withFake = fake.returns({ body: views });
  //   const inFake = fake.returns({
  //     with: withFake,
  //   });
  //   const streamFake = fake.returns({
  //     in: inFake,
  //   });
  //   const rpcFake = fake.returns({
  //     stream: streamFake,
  //   });
  //   replace(deps, "rpc", rpcFake);

  //   const fn = "some-fn";
  //   const { body: result } = await viewStore({
  //     name,
  //     domain,
  //     service,
  //     context,
  //     network,
  //   })
  //     .set({
  //       context: contexts,
  //       currentToken,
  //       token: {
  //         internalFn: internalTokenFn,
  //         externalFn: externalTokenFn,
  //         key,
  //       },
  //     })
  //     .stream(fn, { query, sort, root });

  //   expect(rpcFake).to.have.been.calledWith(
  //     name,
  //     domain,
  //     service,
  //     context,
  //     "view-store"
  //   );
  //   expect(streamFake).to.have.been.calledWith(fn, { query, sort, id: root });
  //   expect(inFake).to.have.been.calledWith({ context: contexts });
  //   expect(withFake).to.have.been.calledWith({
  //     path: "/stream",
  //     internalTokenFn,
  //     externalTokenFn,
  //     currentToken,
  //     key,
  //   });
  //   expect(result).to.equal(views);
  // });
  // it("should call stream with the correct params and optionals omitted", async () => {
  //   const views = "some-views";
  //   const withFake = fake.returns({ body: views });
  //   const inFake = fake.returns({
  //     with: withFake,
  //   });
  //   const streamFake = fake.returns({
  //     in: inFake,
  //   });
  //   const rpcFake = fake.returns({
  //     stream: streamFake,
  //   });
  //   replace(deps, "rpc", rpcFake);

  //   const fn = "some-fn";
  //   const result = await viewStore({ name }).stream(fn, {
  //     query,
  //   });

  //   expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
  //   expect(streamFake).to.have.been.calledWith(fn, { query });
  //   expect(inFake).to.have.been.calledWith({});
  //   expect(withFake).to.have.been.calledWith({
  //     path: "/stream",
  //   });
  //   expect(result).to.deep.equal({ body: views });
  // });
  // it("should call stream with the correct params onto other host", async () => {
  //   const views = "some-views";
  //   const withFake = fake.returns({ body: views });
  //   const inFake = fake.returns({
  //     with: withFake,
  //   });
  //   const streamFake = fake.returns({
  //     in: inFake,
  //   });
  //   const rpcFake = fake.returns({
  //     stream: streamFake,
  //   });
  //   replace(deps, "rpc", rpcFake);

  //   const otherNetwork = "some-other-network";
  //   const fn = "some-fn";
  //   const { body: result } = await viewStore({
  //     name,
  //     domain,
  //     context,
  //     network: otherNetwork,
  //   })
  //     .set({ context: contexts, token: { externalFn: externalTokenFn, key } })
  //     .stream(fn, { query, sort });

  //   expect(rpcFake).to.have.been.calledWith(
  //     name,
  //     domain,
  //     context,
  //     "view-store"
  //   );
  //   expect(streamFake).to.have.been.calledWith(fn, { query, sort });
  //   expect(inFake).to.have.been.calledWith({
  //     context: contexts,
  //     network: otherNetwork,
  //     host: "v.some-domain.some-context.some-other-network",
  //   });
  //   expect(withFake).to.have.been.calledWith({
  //     path: "/some-name/stream",
  //     externalTokenFn,
  //     key,
  //   });
  //   expect(result).to.equal(views);
  // });
  it("should call update with the correct params", async () => {
    const withFake = fake.returns({});
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const update = "some-update";
    await viewStore({ name, context })
      .set({
        context: contexts,
        token: {
          internalFn: internalTokenFn,
        },
      })
      .update({ query, update });

    expect(rpcFake).to.have.been.calledWith(name, context, "view-store");
    expect(postFake).to.have.been.calledWith({ query, update });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
    });
  });
  it("should call update with the correct params and optionals omitted", async () => {
    const withFake = fake.returns({});
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const update = "some-update";
    await viewStore({ name }).update({ query, update });

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(postFake).to.have.been.calledWith({ query, update });
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

    await viewStore({ name, context })
      .set({
        context: contexts,
        token: {
          internalFn: internalTokenFn,
        },
      })
      .delete(root);

    expect(rpcFake).to.have.been.calledWith(name, context, "view-store");
    expect(deleteFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
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

    await viewStore({ name }).delete(root);

    expect(rpcFake).to.have.been.calledWith(name, envContext, "view-store");
    expect(deleteFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
});
