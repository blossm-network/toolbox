const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, match } = require("sinon");

const post = require("..");
const deps = require("../deps");

const payload = "some-payload";
const eventPayload = "some-event-payload";
const eventRoot = "some-event-root";
const eventAction = "some-event-action";
const cleanedPayload = "some-cleaned-payload";
const filledPayload = "some-filled-payload";
const response = "some-response";
const root = "some-root";
const lastEventNumber = "some-last-event-number";
const state = "some-state";
const options = "some-options";
const event = {
  headers: {
    root
  }
};
const correctNumber = 4;
const context = "some-context";
const session = "some-session";
const trace = "some-trace";
const id = "some-id";
const issued = "some-issued";
const idempotency = "some-idempotency";

const headers = {
  trace,
  id,
  issued,
  idempotency
};

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.NAME = name;
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
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params will fillFn", async () => {
    const validateFnFake = fake();
    const fillFnFake = fake.returns(filledPayload);
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      fillFn: fillFnFake
    })(req, res);

    expect(fillFnFake).to.have.been.calledWith(payload);
    expect(normalizeFnFake).to.have.been.calledWith(filledPayload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params with no response", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber
      }
    ];
    const mainFnFake = fake.returns({
      events
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params with root, options, session, version passed in, and no payload", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const version = "some-version";
    const events = [
      {
        root: eventRoot,
        action: eventAction,
        version,
        correctNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const currentRoot = "current-root";
    const req = {
      body: {
        root: currentRoot,
        payload,
        headers,
        options,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      root: currentRoot,
      options,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      root: eventRoot,
      payload: {},
      trace,
      action: eventAction,
      domain,
      service,
      version,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with no clean or validate, correctNubmer, and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const events = [
      {
        payload: eventPayload,
        action: eventAction
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      payload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event);
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params without default action, domain, service, and networks", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const eventDomain = "some-other-event-domain";

    const events = [
      {
        payload: eventPayload,
        correctNumber,
        action: eventAction,
        domain: eventDomain
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateDomain = "some-aggregate-domain";
    const aggregateService = "some-aggregate-service";
    const aggregateNetwork = "some-aggregate-network";

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root,
      {
        domain: aggregateDomain,
        service: aggregateService,
        network: aggregateNetwork
      }
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain: aggregateDomain,
      service: aggregateService,
      network: aggregateNetwork
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain: eventDomain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain: eventDomain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const mainFnFake = fake.returns({
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(eventStoreFake).to.have.been.calledTwice;
    expect(setFake).to.have.been.calledTwice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with many events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const otherEventPayload = "some-other-event-payload";
    const otherEventAction = "some-other-event-action";
    const otherCorrectNumber = "some-other-correct-number";
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber
      },
      {
        payload: otherEventPayload,
        action: otherEventAction,
        correctNumber: otherCorrectNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn: match(fn => expect(fn()).to.exist)
    });

    const aggregateFnResult = await mainFnFake.lastCall.lastArg.aggregateFn(
      root
    );
    expect(eventStoreFake).to.have.been.calledWith({
      domain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: otherEventPayload,
      trace,
      action: otherEventAction,
      domain,
      service,
      version: 0,
      idempotency,
      command: {
        id,
        issued,
        name,
        domain,
        service,
        network
      }
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain
    });
    expect(eventStoreFake).to.have.been.callCount(4);
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(addFake).to.have.been.calledWith(event, {
      number: otherCorrectNumber
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.callCount(4);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with many events both sync and async", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const addFake = fake();
    const aggregateResult = {
      headers: {
        lastEventNumber
      },
      state
    };
    const aggregateFake = fake.returns(aggregateResult);
    const setFake = fake.returns({
      add: addFake,
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });

    const otherEventPayload = "some-other-event-payload";
    const otherEventAction = "some-other-event-action";
    const otherOtherEventPayload = "some-other-other-event-payload";
    const events = [
      {
        payload: eventPayload,
        action: eventAction
      },
      {
        payload: otherEventPayload,
        action: otherEventAction,
        correctNumber,
        async: false
      },
      {
        payload: otherOtherEventPayload
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        payload,
        headers,
        context,
        session
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(createEventFake.thirdCall).to.have.been.calledAfter(
      addFake.secondCall
    );
  });
});
