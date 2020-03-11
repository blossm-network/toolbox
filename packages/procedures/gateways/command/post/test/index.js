const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const post = require("..");

const response = { a: 1 };
const payload = "some-payload";
const headers = "some-headers";
const body = "some-body";
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";

const root = "some-root";

describe("Command gateway post", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const normalizeFake = fake.returns({ payload, headers, root });
    replace(deps, "normalize", normalizeFake);

    const issueFake = fake.returns({
      ...response,
      tokens: { a: 1 }
    });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {}
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake
    };

    await post({ name, domain })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(normalizeFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain
    });
    expect(setFake).to.have.been.calledWith({
      tokenFn: deps.gcpToken,
      context,
      claims
    });
    expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
    expect(statusFake).to.have.been.calledWith(200);
    // expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params if response is empty", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const normalizeFake = fake.returns({ payload, headers, root });
    replace(deps, "normalize", normalizeFake);

    const issueFake = fake.returns();
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {}
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const cookieFake = fake();
    const res = {
      status: statusFake,
      cookie: cookieFake
    };

    await post({ name, domain })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(normalizeFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain
    });
    expect(setFake).to.have.been.calledWith({
      tokenFn: deps.gcpToken,
      context,
      claims
    });
    expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params if tokens is in the response", async () => {
    const validateFake = fake();
    replace(deps, "validate", validateFake);

    const normalizeFake = fake.returns({ payload, headers, root });
    replace(deps, "normalize", normalizeFake);

    const token1 = "some-token";
    const token2 = "some-other-token";
    const issueFake = fake.returns({ tokens: { token1, token2 } });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      claims,
      body,
      params: {}
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const cookieFake = fake();
    const res = {
      cookie: cookieFake,
      status: statusFake
    };

    await post({ name, domain })(req, res);

    expect(cookieFake).to.have.been.calledTwice;
    expect(cookieFake).to.have.been.calledWith("token1", token1, {
      httpOnly: true,
      secure: true
    });
    expect(cookieFake).to.have.been.calledWith("token2", token2, {
      httpOnly: true,
      secure: true
    });
    expect(validateFake).to.have.been.calledWith(body);
    expect(normalizeFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      name,
      domain
    });
    expect(setFake).to.have.been.calledWith({
      tokenFn: deps.gcpToken,
      context,
      claims
    });
    expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
    // expect(statusFake).to.have.been.calledWith(204);
    expect(statusFake).to.have.been.calledWith(200);
    // expect(sendFake).to.have.been.calledWith();
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const validateFake = fake.rejects(new Error(errorMessage));
    replace(deps, "validate", validateFake);

    const req = {
      context,
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const cookieFake = fake();
    const res = {
      status: statusFake,
      cookie: cookieFake
    };

    try {
      await post({ name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
