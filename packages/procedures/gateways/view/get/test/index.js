const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = "some-query";
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";

describe("View gateway get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const readFake = fake.returns(results);
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      claims,
      query
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await get({ name })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({ name });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFns: { internal: deps.gcpToken }
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with context and domain", async () => {
    const readFake = fake.returns(results);
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      claims,
      query
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const contextParam = "some-context";
    await get({ name, domain, context: contextParam })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({
      name,
      domain,
      context: contextParam
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFns: { internal: deps.gcpToken }
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await get({ name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
