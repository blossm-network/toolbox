const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, match } = require("sinon");

const post = require("..");
const deps = require("../deps");

const payload = "some-payload";
const eventPayload = "some-event-payload";
const eventRoot = "some-event-root";
const cleanedPayload = "some-cleaned-payload";
const response = "some-response";
const root = "some-root";
const lastEventNumber = "some-last-event-number";
const state = "some-state";
const event = {
  headers: {
    root
  }
};
const correctNumber = 4;
const context = "some-context";
const trace = "some-trace";
const id = "some-id";
const issued = "some-issued";
const headers = {
  trace,
  id,
  issued
};

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
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
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
      context,
      action,
      domain,
      version: 0,
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
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
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
        correctNumber
      }
    ];
    const mainFnFake = fake.returns({
      events
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
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
      context,
      action,
      domain,
      version: 0,
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
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledThrice;
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params with root and version passed in", async () => {
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
        version,
        payload: eventPayload,
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
        context,
        root: currentRoot,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      root: currentRoot,
      context,
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
      tokenFn: deps.gcpToken
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFnResult).to.deep.equal({
      lastEventNumber,
      aggregate: state
    });
    expect(createEventFake).to.have.been.calledWith({
      root: eventRoot,
      payload: eventPayload,
      trace,
      context,
      action,
      domain,
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
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
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
        payload: eventPayload
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        context,
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
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith({
      payload,
      context,
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
      context,
      action,
      domain,
      version: 0,
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
      domain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event);
    expect(setFake).to.have.been.calledWith({
      context,
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

    const eventAction = "some-other-event-action";
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
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
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
      context,
      action: eventAction,
      domain: eventDomain,
      version: 0,
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
      domain: eventDomain
    });
    expect(eventStoreFake).to.have.been.calledThrice;
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(setFake).to.have.been.calledWith({
      context,
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
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
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
    const otherCorrectNumber = "some-other-correct-number";
    const events = [
      {
        payload: eventPayload,
        correctNumber
      },
      {
        payload: otherEventPayload,
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
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
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
      context,
      action,
      domain,
      version: 0,
      command: {
        id,
        issued,
        action,
        domain,
        service,
        network
      }
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: otherEventPayload,
      trace,
      context,
      action,
      domain,
      version: 0,
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
      domain
    });
    expect(eventStoreFake).to.have.been.callCount(4);
    expect(addFake).to.have.been.calledWith(event, { number: correctNumber });
    expect(addFake).to.have.been.calledWith(event, {
      number: otherCorrectNumber
    });
    expect(setFake).to.have.been.calledWith({
      context,
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
    const otherOtherEventPayload = "some-other-other-event-payload";
    const otherCorrectNumber = "some-other-correct-number";
    const otherOtherCorrectNumber = "some-other-other-correct-number";
    const events = [
      {
        payload: eventPayload,
        correctNumber
      },
      {
        payload: otherEventPayload,
        correctNumber: otherCorrectNumber,
        async: false
      },
      {
        payload: otherOtherEventPayload,
        correctNumber: otherOtherCorrectNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
    replace(deps, "eventStore", eventStoreFake);
    const req = {
      body: {
        context,
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
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake
    })(req, res);

    expect(createEventFake.thirdCall).to.have.been.calledAfter(
      addFake.secondCall
    );
  });
});
