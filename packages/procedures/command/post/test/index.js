const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const payload = "some-payload";
const eventPayload = "some-event-payload";
const eventRoot = "some-event-root";
const eventAction = "some-event-action";
const cleanedPayload = "some-cleaned-payload";
const filledPayload = "some-filled-payload";
const aggregateFn = "some-aggregate-fn";
const response = { some: "response" };
const root = "some-root";
const options = "some-options";
const commandId = "some-command-id";
const event = {
  headers: {
    root,
  },
};
const correctNumber = 4;
const context = "some-context";
const claims = "some-claims";
const trace = "some-trace";
const issued = "some-issued";
const accepted = "some-accepted";
const broadcasted = "some-broadcasted";
const idempotency = "some-idempotency";

const headers = {
  trace,
  issued,
  accepted,
  broadcasted,
  idempotency,
};

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const host = "some-host";
const procedure = "some-procedure";
const hash = "some-op-hash";

process.env.NAME = name;
process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;
process.env.HOST = host;
process.env.PROCEDURE = procedure;
process.env.OPERATION_HASH = hash;

describe("Command handler post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });
    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      events: [
        {
          data: event,
          number: correctNumber,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
  it("should call with the correct params with status code and headers", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));

    const statusCode = "some-status-code";
    const responseHeaders = { some: "headers" };

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
      statusCode,
      headers: responseHeaders,
    });
    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      events: [
        {
          data: event,
          number: correctNumber,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith(responseHeaders);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
  it("should call with the correct params with added header path", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });
    const otherPath = "some-other-path";
    const req = {
      body: {
        payload,
        headers: {
          ...headers,
          path: [otherPath],
        },
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
    })(req, res);

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        otherPath,
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
    });
  });
  it("should call with the correct params with fillFn", async () => {
    const validateFnFake = fake();
    const fillFnFake = fake.returns(filledPayload);
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });

    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      fillFn: fillFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(fillFnFake).to.have.been.calledWith(payload);
    expect(normalizeFnFake).to.have.been.calledWith(filledPayload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params will thenFn", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const thenFnFake = fake();
    const mainFnFake = fake.returns({
      events,
      response,
      thenFn: thenFnFake,
    });

    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(thenFnFake).to.have.been.calledWith();
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params with no response", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
    });

    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      events: [{ data: event, number: correctNumber }],
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ _id: commandId });
  });
  it("should call with the correct params with no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [];
    const mainFnFake = fake.returns({
      events,
      response,
    });

    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
    });

    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(response);
  });
  it("should call with the correct params with no response and no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [];
    const mainFnFake = fake.returns({
      events,
    });

    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendStatusFake = fake();
    const setResponseFake = fake.returns({
      sendStatus: sendStatusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
    });

    expect(setResponseFake).to.have.been.calledWith({});
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with root, context, options, token, claims, version passed in, and no payload", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const version = "some-version";
    const eventContext = "some-event-context";
    const events = [
      {
        root: eventRoot,
        context: eventContext,
        action: eventAction,
        version,
        correctNumber,
      },
    ];

    const addFnFake = fake();

    const mainFnFake = fake.returns({
      events,
      response,
    });
    const currentRoot = "current-root";
    const token = "some-token";
    const req = {
      body: {
        root: currentRoot,
        payload,
        headers,
        options,
        context,
        claims,
        token,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      root: currentRoot,
      options,
      context,
      claims,
      token,
      aggregateFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      context,
      claims,
      events: [{ data: event, number: correctNumber }],
    });

    expect(createEventFake).to.have.been.calledWith({
      root: eventRoot,
      payload: {},
      trace,
      action: eventAction,
      domain,
      service,
      version,
      context: eventContext,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
  it("should call with the correct params with no clean or validate, correctNubmer, and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });
    const req = {
      body: {
        payload,
        headers,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(mainFnFake).to.have.been.calledWith({
      payload,
      aggregateFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      events: [{ data: event }],
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
  it("should call with the correct params without default action, domain, service, and networks", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));

    const eventDomain = "some-other-event-domain";
    const eventService = "some-other-event-service";

    const events = [
      {
        payload: eventPayload,
        correctNumber,
        action: eventAction,
        domain: eventDomain,
        service: eventService,
      },
    ];

    const mainFnFake = fake.returns({
      events,
      response,
    });

    const req = {
      body: {
        payload,
        headers,
        context,
        claims,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain: eventDomain,
      service: eventService,
      context,
      claims,
      events: [{ data: event, number: correctNumber }],
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain: eventDomain,
      service: eventService,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });

  it("should call with the correct params with many events in different services", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const otherEventPayload = "some-other-event-payload";
    const otherEventAction = "some-other-event-action";
    const otherCorrectNumber = "some-other-correct-number";
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
      {
        payload: otherEventPayload,
        action: otherEventAction,
        correctNumber: otherCorrectNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });
    const req = {
      body: {
        payload,
        headers,
        context,
        claims,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          procedure,
          hash,
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
        },
      ],
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: otherEventPayload,
      trace,
      action: otherEventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
          procedure,
          hash,
        },
      ],
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      context,
      claims,
      events: [
        { data: event, number: correctNumber },
        { data: event, number: otherCorrectNumber },
      ],
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
  it("should call with the correct params with many events in different domains and services", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(deps, "uuid", fake.returns(commandId));
    const otherEventPayload = "some-other-event-payload";
    const otherEventAction = "some-other-event-action";
    const otherCorrectNumber = "some-other-correct-number";
    const differentDomain = "some-different-domain";
    const differentService = "some-other-event-service";
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
      {
        payload: otherEventPayload,
        action: otherEventAction,
        domain: differentDomain,
        service: differentService,
        correctNumber: otherCorrectNumber,
      },
    ];
    const mainFnFake = fake.returns({
      events,
      response,
    });
    const req = {
      body: {
        payload,
        headers,
        context,
        claims,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };

    const addFnFake = fake();
    const aggregateFnFake = fake.returns(aggregateFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      trace,
      action: eventAction,
      domain,
      service,
      version: 0,
      idempotency,
      path: [
        {
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
          procedure,
          hash,
        },
      ],
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: otherEventPayload,
      trace,
      action: otherEventAction,
      domain: differentDomain,
      service: differentService,
      version: 0,
      idempotency,
      path: [
        {
          id: commandId,
          issued,
          timestamp: deps.dateString(),
          name,
          domain,
          service,
          network,
          host,
          procedure,
          hash,
        },
      ],
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      context,
      claims,
      events: [{ data: event, number: correctNumber }],
    });
    expect(addFnFake).to.have.been.calledWith({
      domain: differentDomain,
      service: differentService,
      context,
      claims,
      events: [{ data: event, number: otherCorrectNumber }],
    });
    expect(addFnFake).to.have.been.calledTwice;
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({ ...response, _id: commandId });
  });
});
