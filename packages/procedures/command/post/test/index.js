const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, stub, replace, useFakeTimers } = require("sinon");

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
const commandFn = "some-command-fn";
const queryAggregatesFn = "some-query-aggregates-fn";
const readFactFn = "some-read-fact-fn";
const streamFactFn = "some-steram-fact-fn";
const countFn = "some-count-fn";
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
const idempotency = "some-idempotency";
const ip = "some-ip";

const headers = {
  issued,
  idempotency,
};

const scenario = {
  ip,
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

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );

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
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      ip,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
      eventData: [
        {
          event,
          number: correctNumber,
        },
      ],
      scenario: {
        ip,
        trace,
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
      },
      async: false,
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params with status code and headers", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );

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
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      ip,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
      eventData: [
        {
          event,
          number: correctNumber,
        },
      ],
      scenario: {
        ip,
        trace,
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
      },
      async: false,
    });
    expect(setResponseFake).to.have.been.calledWith(responseHeaders);
    expect(statusFake).to.have.been.calledWith(statusCode);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params with added scenario path", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );

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
        headers,
        scenario: {
          ...scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
      _trace: trace,
    });
  });
  it("should call with the correct params with fillFn", async () => {
    const validateFnFake = fake();
    const fillFnFake = fake.returns(filledPayload);
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      fillFn: fillFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      addFn: addFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
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
    expect(fillFnFake).to.have.been.calledWith(payload);
    expect(normalizeFnFake).to.have.been.calledWith(filledPayload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params will thenFn", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
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
    expect(thenFnFake).to.have.been.calledWith();
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
  });
  it("should call with the correct params with no response", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      ip,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      eventData: [{ event, number: correctNumber }],
      scenario: {
        ip,
        trace,
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
      },
      async: false,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
    expect(sendFake).to.have.been.calledWith({ _id: commandId, _trace: trace });
  });
  it("should call with the correct params with no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
    const events = [];
    const mainFnFake = fake.returns({
      events,
      response,
    });

    const req = {
      body: {
        payload,
        headers,
        scenario,
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      ip,
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      ip,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
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

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
    const events = [];
    const mainFnFake = fake.returns({
      events,
    });

    const req = {
      body: {
        payload,
        headers,
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload);
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(setResponseFake).to.have.been.calledWith({});
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with root, context, options, token, claims, version passed in, and no payload", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
    const version = "some-version";
    const eventContext = { some: "event-context" };
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
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims, token });
    expect(queryAggregatesFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(readFactFnFake).to.have.been.calledWith({ context, claims, token });
    expect(streamFactFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(countFnFake).to.have.been.calledWith({
      context,
      claims,
      token,
    });
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      context,
      claims,
      token,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload, {
      context,
    });
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      root: currentRoot,
      context,
      options,
      claims,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      context,
      claims,
      eventData: [{ event, number: correctNumber }],
      async: false,
      scenario: {
        trace,
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
      },
    });

    expect(createEventFake).to.have.been.calledWith({
      root: eventRoot,
      payload: {},
      action: eventAction,
      domain,
      service,
      network,
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
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params with no clean or validate, correctNumber, and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      addFn: addFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      path: [
        ...(req.body.headers.path || []),
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
    expect(mainFnFake).to.have.been.calledWith({
      payload,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      eventData: [{ event }],
      async: true,
      scenario: {
        trace,
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
      },
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params without default action, domain, service, and networks", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );

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
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(queryAggregatesFnFake).to.have.been.calledWith({ context, claims });
    expect(readFactFnFake).to.have.been.calledWith({ context, claims });
    expect(streamFactFnFake).to.have.been.calledWith({ context, claims });
    expect(countFnFake).to.have.been.calledWith({ context, claims });
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      context,
      claims,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload, {
      context,
    });
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(addFnFake).to.have.been.calledWith({
      domain: eventDomain,
      service: eventService,
      context,
      claims,
      eventData: [{ event, number: correctNumber }],
      scenario: {
        trace,
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
      },
      async: false,
    });
    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain: eventDomain,
      service: eventService,
      network,
      version: 0,
      context,
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
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });

  it("should call with the correct params with many events in different services", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(queryAggregatesFnFake).to.have.been.calledWith({ context, claims });
    expect(readFactFnFake).to.have.been.calledWith({ context, claims });
    expect(streamFactFnFake).to.have.been.calledWith({ context, claims });
    expect(countFnFake).to.have.been.calledWith({ context, claims });
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      context,
      claims,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload, { context });
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
      context,
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
      action: otherEventAction,
      domain,
      service,
      network,
      context,
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
      eventData: [
        { event, number: correctNumber },
        { event, number: otherCorrectNumber },
      ],
      scenario: {
        trace,
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
      },
      async: false,
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params with many events in different domains and services", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );
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
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
      addFn: addFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ context, claims });
    expect(queryAggregatesFnFake).to.have.been.calledWith({ context, claims });
    expect(readFactFnFake).to.have.been.calledWith({ context, claims });
    expect(streamFactFnFake).to.have.been.calledWith({ context, claims });
    expect(countFnFake).to.have.been.calledWith({ context, claims });
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      context,
      claims,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload, { context });
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      context,
      claims,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
      context,
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
      action: otherEventAction,
      domain: differentDomain,
      service: differentService,
      context,
      network,
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
      eventData: [{ event, number: correctNumber }],
      scenario: {
        trace,
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
      },
      async: false,
    });
    expect(addFnFake).to.have.been.calledWith({
      domain: differentDomain,
      service: differentService,
      context,
      claims,
      eventData: [{ event, number: otherCorrectNumber }],
      scenario: {
        trace,
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
      },
      async: false,
    });
    expect(addFnFake).to.have.been.calledTwice;
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
  it("should call with the correct params with core network removed from aud", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(trace)
    );

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
    const claims = {};
    const req = {
      body: {
        payload,
        headers,
        scenario: {},
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
    const commandFnFake = fake.returns(commandFn);
    const queryAggregatesFnFake = fake.returns(queryAggregatesFn);
    const readFactFnFake = fake.returns(readFactFn);
    const streamFactFnFake = fake.returns(streamFactFn);
    const countFnFake = fake.returns(countFn);

    await post({
      mainFn: mainFnFake,
      validateFn: validateFnFake,
      normalizeFn: normalizeFnFake,
      addFn: addFnFake,
      aggregateFn: aggregateFnFake,
      commandFn: commandFnFake,
      queryAggregatesFn: queryAggregatesFnFake,
      readFactFn: readFactFnFake,
      streamFactFn: streamFactFnFake,
      countFn: countFnFake,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({ claims });
    expect(queryAggregatesFnFake).to.have.been.calledWith({ claims });
    expect(readFactFnFake).to.have.been.calledWith({ claims });
    expect(streamFactFnFake).to.have.been.calledWith({ claims });
    expect(countFnFake).to.have.been.calledWith({ claims });
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      trace,
      claims,
      path: [
        ...(req.body.headers.path || []),
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
    expect(normalizeFnFake).to.have.been.calledWith(payload);
    expect(validateFnFake).to.have.been.calledWith(payload, {});
    expect(mainFnFake).to.have.been.calledWith({
      payload: cleanedPayload,
      claims,
      aggregateFn,
      commandFn,
      queryAggregatesFn,
      readFactFn,
      streamFactFn,
      countFn,
    });

    expect(createEventFake).to.have.been.calledWith({
      payload: eventPayload,
      action: eventAction,
      domain,
      service,
      network,
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
      eventData: [
        {
          event,
          number: correctNumber,
        },
      ],
      claims,
      scenario: {
        trace,
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
      },
      async: false,
    });
    expect(setResponseFake).to.have.been.calledWith({});
    expect(statusFake).to.have.been.calledWith(202);
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _id: commandId,
      _trace: trace,
    });
  });
});
