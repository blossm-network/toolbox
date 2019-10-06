const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const viewStore = require("..");

const id = "some-id!";
const domain = "some-domain!";
const service = "some-service";
const network = "some-network";

const tokenFn = "some-token-fn";

const query = "some-query";
const properties = "some-params";
const root = "some-root";
const context = { c: 2 };

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
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    await viewStore({ id, domain, service, network })
      .create(properties)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(id, domain, "view-store");
    expect(postFake).to.have.been.calledWith(properties);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
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
    const operationFake = fake.returns({
      get: getFake
    });
    replace(deps, "operation", operationFake);

    const result = await viewStore({ id, domain, service, network })
      .read(query)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(id, domain, "view-store");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({
      tokenFn
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
    const operationFake = fake.returns({
      put: putFake
    });
    replace(deps, "operation", operationFake);

    await viewStore({ id, domain, service, network })
      .update(root, properties)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(id, domain, "view-store");
    expect(putFake).to.have.been.calledWith(root, properties);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
  });
  it("should call delete with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const deleteFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      delete: deleteFake
    });
    replace(deps, "operation", operationFake);

    await viewStore({ id, domain, service, network })
      .delete(root)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(id, domain, "view-store");
    expect(deleteFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({
      tokenFn
    });
  });
});
