const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = "some-query";
const name = "some-name";
const service = "some-service";
const domain = "some-domain";
const context = "some-context";

describe("View gateway get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params with view-store procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({ procedure: "view-store", name })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({ name });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFns: { internal: deps.gcpToken },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({ content: results });
  });
  it("should call with the correct params with context and domain with view-store procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({ procedure: "view-store", name, domain, service })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({
      name,
      domain,
      service,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFns: { internal: deps.gcpToken },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({ content: results });
  });
  it("should throw correctly with view-store procedure", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    try {
      await get({ procedure: "view-store", name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should call with the correct params with view-composite procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({ procedure: "view-composite", name })(req, res);

    expect(viewCompositeFake).to.have.been.calledWith({ name });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFns: { internal: deps.gcpToken },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({ content: results });
  });
  it("should call with the correct params with context and domain with view-composite procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await get({ procedure: "view-composite", name, domain, service })(req, res);

    expect(viewCompositeFake).to.have.been.calledWith({
      name,
      domain,
      service,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFns: { internal: deps.gcpToken },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({ content: results });
  });
  it("should throw correctly with view-composite procedure", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const req = {
      context,
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    try {
      await get({ procedure: "view-composite", name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
