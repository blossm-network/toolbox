const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const payload = "some-payload";
const eventPayload = "some-event-payload";
const eventRoot = "some-event-root";
const eventAction = "some-event-action";
const cleanedPayload = "some-cleaned-payload";
const filledPayload = "some-filled-payload";
const aggregateFn = "some-aggregate-fn";
const response = "some-response";
const root = "some-root";
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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
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
    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [
        {
          data: event,
          number: correctNumber
        }
      ]
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params will fillFn", async () => {
    const validateFnFake = fake();
    const fillFnFake = fake.returns(filledPayload);
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      fillFn: fillFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(fillFnFake).to.have.been.calledWith(payload);
    expect(normalizeFnFake).to.have.been.calledWith(filledPayload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params with no response", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [{ data: event, number: correctNumber }]
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
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params with root, options, session, version passed in, and no payload", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const version = "some-version";
    const events = [
      {
        root: eventRoot,
        action: eventAction,
        version,
        correctNumber
      }
    ];

    const addFnFake = fake();

    const mainFnFake = fake.returns({
      events,
      response
    });
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

    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      root: currentRoot,
      options,
      context,
      session,
      aggregateFn
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [{ data: event, number: correctNumber }]
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
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with no clean or validate, correctNubmer, and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(mainFnFake).to.have.been.calledWith({
      payload,
      context,
      session,
      aggregateFn
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [{ data: event }]
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
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params without default action, domain, service, and networks", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
    });

    expect(addFnFake).to.have.been.calledWith({
      domain: eventDomain,
      context,
      session,
      events: [{ data: event, number: correctNumber }]
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
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const mainFnFake = fake.returns({
      response
    });

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
    });

    expect(addFnFake).to.not.have.been.called;

    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with many events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
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
    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [
        { data: event, number: correctNumber },
        { data: event, number: otherCorrectNumber }
      ]
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with many events in different domains", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    const otherEventPayload = "some-other-event-payload";
    const otherEventAction = "some-other-event-action";
    const otherCorrectNumber = "some-other-correct-number";
    const differentDomain = "some-different-domain";
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber
      },
      {
        payload: otherEventPayload,
        action: otherEventAction,
        domain: differentDomain,
        correctNumber: otherCorrectNumber
      }
    ];
    const mainFnFake = fake.returns({
      events,
      response
    });
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

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, session });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      session,
      aggregateFn
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
      domain: differentDomain,
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
    expect(addFnFake).to.have.been.calledWith({
      domain,
      context,
      session,
      events: [{ data: event, number: correctNumber }]
    });
    expect(addFnFake).to.have.been.calledWith({
      domain: differentDomain,
      context,
      session,
      events: [{ data: event, number: otherCorrectNumber }]
    });
    expect(addFnFake).to.have.been.calledTwice;
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
});
