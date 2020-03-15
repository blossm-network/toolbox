const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const viewStore = require("..");

const name = "some-name!";
const domain = "some-domain!";
const service = "some-service";
const host = "some-host";

const tokenFn = "some-token-fn";

const query = "some-query";
const sort = "some-sort";
const view = "some-view";
const root = "some-root";
const context = { c: 2 };
const claims = "some-claims";

const envService = "some-env-service";
process.env.SERVICE = envService;

describe("Get views", () => {
  afterEach(() => {
    restore();
  });

  it("should call create with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain, service, host })
      .set({ context, tokenFn, claims })
      .create(view);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "view-store"
    );
    expect(postFake).to.have.been.calledWith({ view });
    expect(inFake).to.have.been.calledWith({ context, host });
    expect(withFake).to.have.been.calledWith({ tokenFn, claims });
  });
  it("should call create with the correct params and optionals omitted", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain }).create(view);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "view-store"
    );
    expect(postFake).to.have.been.calledWith({ view });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
  it("should call read with the correct params", async () => {
    const views = "some-views";
    const withFake = fake.returns(views);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await viewStore({ name, domain, service, host })
      .set({ context, tokenFn })
      .read({ query, sort });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "view-store"
    );
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({ context, host });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
    expect(result).to.equal(views);
  });
  it("should call read with the correct params and optionals omitted", async () => {
    const views = "some-views";
    const withFake = fake.returns(views);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await viewStore({ name, domain }).read({
      query
    });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "view-store"
    );
    expect(getFake).to.have.been.calledWith({ query });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
    expect(result).to.equal(views);
  });
  it("should call stream with the correct params", async () => {
    const views = "some-views";
    const withFake = fake.returns(views);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await viewStore({ name, domain, service, host })
      .set({ context, tokenFn })
      .stream({ query, sort });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "view-store"
    );
    expect(getFake).to.have.been.calledWith({ query, sort });
    expect(inFake).to.have.been.calledWith({ context, host });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      tokenFn
    });
    expect(result).to.equal(views);
  });
  it("should call stream with the correct params and optionals omitted", async () => {
    const views = "some-views";
    const withFake = fake.returns(views);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await viewStore({ name, domain }).stream({
      query
    });

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "view-store"
    );
    expect(getFake).to.have.been.calledWith({ query });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream"
    });
    expect(result).to.equal(views);
  });
  it("should call update with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const putFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      put: putFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain, service, host })
      .set({ context, tokenFn })
      .update(root, view);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "view-store"
    );
    expect(putFake).to.have.been.calledWith(root, { view });
    expect(inFake).to.have.been.calledWith({ context, host });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
  });
  it("should call update with the correct params and optionals omitted", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const putFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      put: putFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain }).update(root, view);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "view-store"
    );
    expect(putFake).to.have.been.calledWith(root, { view });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
  it("should call delete with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const deleteFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      delete: deleteFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain, service, host })
      .set({ context, tokenFn })
      .delete(root);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "view-store"
    );
    expect(deleteFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({ context, host });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
  });
  it("should call delete with the correct params with optionals omitted", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const deleteFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      delete: deleteFake
    });
    replace(deps, "rpc", rpcFake);

    await viewStore({ name, domain }).delete(root);

    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "view-store"
    );
    expect(deleteFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
});
