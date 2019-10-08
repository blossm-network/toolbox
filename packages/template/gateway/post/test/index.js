const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const payload = "some-payload";
const normalizedPayload = "some-normalized-payload";
const trace = "some-trace";
const id = "some-id";
const issued = "some-issued";
const headers = {
  trace,
  id,
  issued
};
const body = {
  payload,
  headers
};
const root = "some-root";
const event = {
  headers: {
    root
  }
};
const context = "some-context";

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Gateway post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const validateFake = fake.returns(event);
    replace(deps, "validate", validateFake);

    const normalizeFake = fake.returns({
      payload: normalizedPayload,
      headers
    });
    replace(deps, "clean", normalizeFake);

    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const issueFake = fake.returns({
      in: inFake
    });
    const commandFake = fake.returns({
      issue: issueFake
    });
    replace(deps, "command", commandFake);
    const req = {
      body,
      params: {
        action,
        domain
      },
      context
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post()(req, res);

    expect(validateFake).to.have.been.calledWith(body);
    expect(normalizeFake).to.have.been.calledWith(body);
    expect(commandFake).to.have.been.calledWith({
      action,
      domain,
      service,
      network
    });
    expect(issueFake).to.have.been.calledWith(normalizedPayload, headers);
    expect(inFake).to.have.been.calledWith(context);
    expect(withFake).to.have.been.calledWith(deps.gcpToken);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should throw correctly", async () => {
    const validateFake = fake.returns(event);
    replace(deps, "validate", validateFake);

    const cleanFake = fake.returns({ payload: normalizedPayload, headers });
    replace(deps, "clean", cleanFake);

    const errMessage = "some-err-message";
    const withFake = fake.throws(new Error(errMessage));
    const inFake = fake.returns({
      with: withFake
    });
    const issueFake = fake.returns({
      in: inFake
    });
    const commandFake = fake.returns({
      issue: issueFake
    });
    replace(deps, "command", commandFake);
    const req = {
      body,
      params: {
        action,
        domain
      },
      context
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await post()(req, res);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errMessage);
    }
  });
});
