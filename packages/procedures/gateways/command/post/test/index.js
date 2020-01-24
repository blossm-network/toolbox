const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const post = require("..");

const response = "some-reponse";
const payload = "some-payload";
const headers = "some-headers";
const body = "some-body";
const action = "some-action";
const domain = "some-domain";
const context = "some-context";
const session = "some-session";

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

    const issueFake = fake.returns(response);
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const req = {
      context,
      session,
      body,
      params: {}
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({ action, domain })(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(normalizeFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      action,
      domain
    });
    expect(setFake).to.have.been.calledWith({
      tokenFn: deps.gcpToken,
      context,
      session
    });
    expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const validateFake = fake.throws(new Error(errorMessage));
    replace(deps, "validate", validateFake);

    const req = {
      context,
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await post({ action, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
