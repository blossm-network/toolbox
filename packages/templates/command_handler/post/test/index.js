const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const payload = "some-payload";
const cleanedPayload = "some-cleaned-payload";
const eventPayload = "some-event-payload";
const response = "some-response";
const root = "some-root";
const event = {
  headers: {
    root
  }
};
const context = "some-context";
const trace = "some-trace";
const id = "some-id";
const issued = "some-issued";
const headers = {
  trace,
  id,
  issued
};

const version = 0;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.ACTION = action;
process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const setFake = fake.returns({
      add: addFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    const mainFnFake = fake.returns({
      payload: eventPayload,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      context,
      body: {
        payload,
        headers
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      version,
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      context,
      version,
      command: {
        id,
        issued,
        action,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(addFake).to.have.been.calledWith(event);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ root, ...response });
  });
  it("should call with the correct params with root passed in", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const setFake = fake.returns({
      add: addFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    const mainFnFake = fake.returns({
      payload: eventPayload,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const currentRoot = "current-root";
    const req = {
      context,
      body: {
        payload,
        headers: {
          ...headers,
          root: currentRoot
        }
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      version,
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context
    });
    expect(createEventFake).to.have.been.calledWith({
      root: currentRoot,
      payload: eventPayload,
      trace,
      context,
      version,
      command: {
        id,
        issued,
        action,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(addFake).to.have.been.calledWith(event);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ root, ...response });
  });
  it("should call with the correct params with no clean or validate and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const setFake = fake.returns({
      add: addFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    const mainFnFake = fake.returns({
      payload: eventPayload
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      context,
      body: {
        payload,
        headers
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      version,
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      payload,
      context
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      context,
      version,
      command: {
        id,
        issued,
        action,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(addFake).to.have.been.calledWith(event);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      root
    });
  });
  it("should throw correctly", async () => {
    const createEventFake = fake.rejects(new Error());
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const setFake = fake.returns({
      add: addFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    const mainFnFake = fake.returns({
      payload: eventPayload
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      context,
      body: {
        payload,
        headers
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    expect(
      async () =>
        await post({
          version,
          mainFn: mainFnFake
        })(req, res)
    ).to.throw;
  });
});
