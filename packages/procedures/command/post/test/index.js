const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, fake, stub, replace, useFakeTimers, match } = require("sinon");

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
const correctNumber = 0;
const claims = "some-claims";
const txId = "some-txId";
const issued = "some-issued";
const idempotency = "some-idempotency";
const ip = "some-ip";

const headers = {
  issued,
  idempotency,
};

const tx = {
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx,
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        ip,
        id: txId,
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
      _tx: txId,
    });
  });
  it("should call with the correct params with events coming from the logEventsFn with main returning nothing", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
    );

    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const mainFnFake = stub().yieldsTo("logEventsFn", events);

    const req = {
      body: {
        payload,
        headers,
        tx,
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        ip,
        id: txId,
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
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with status code and headers and txid", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
    const bodyTxId = "some-txid";
    const req = {
      body: {
        payload,
        headers,
        tx: {
          ...tx,
          id: bodyTxId,
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

    expect(aggregateFnFake).to.have.been.calledWith({});
    expect(queryAggregatesFnFake).to.have.been.calledWith({});
    expect(readFactFnFake).to.have.been.calledWith({});
    expect(streamFactFnFake).to.have.been.calledWith({});
    expect(countFnFake).to.have.been.calledWith({});
    expect(commandFnFake).to.have.been.calledWith({
      idempotency,
      txId: bodyTxId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        ip,
        id: bodyTxId,
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
      _tx: bodyTxId,
    });
  });
  it("should call with the correct params with added tx path", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {
          ...tx,
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
      _tx: txId,
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx,
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
      txId,
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
  it("should call with the correct params with thenFn, tokens, and revoke", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
    );
    const events = [
      {
        payload: eventPayload,
        action: eventAction,
        correctNumber,
      },
    ];
    const thenFnFake = fake();
    const tokens = "some-tokens";
    const revoke = "some-revoke";
    const mainFnFake = fake.returns({
      events,
      response,
      thenFn: thenFnFake,
      tokens,
      revoke,
    });

    const req = {
      body: {
        payload,
        headers,
        tx,
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
      txId,
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
    expect(sendFake).to.have.been.calledWith({
      ...response,
      _tokens: tokens,
      _revoke: revoke,
      _id: commandId,
      _tx: txId,
    });
  });
  it("should call with the correct params with no response", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx,
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
    });
    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      eventData: [{ event, number: correctNumber }],
      tx: {
        ip,
        id: txId,
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
    expect(sendFake).to.have.been.calledWith({ _id: commandId, _tx: txId });
  });
  it("should call with the correct params with no events", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx,
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
    );
    const events = [];
    const mainFnFake = fake.returns({
      events,
    });

    const req = {
      body: {
        payload,
        headers,
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
    );
    const version = "some-version";
    const eventContext = { some: "event-context" };
    const groupsAdded = "some-groups-added";
    const groupsRemoved = "some-groups-removed";
    const events = [
      {
        root: eventRoot,
        context: eventContext,
        action: eventAction,
        version,
        correctNumber,
        groupsAdded,
        groupsRemoved,
      },
    ];

    const addFnFake = fake();

    const mainFnFake = fake.returns({
      events,
      response,
    });
    const currentRoot = "current-root";
    const token = "some-token";
    const context1 = "some-context1";
    const context2 = "some-context2";
    const context = { [context1]: "some", [context2]: "some-other" };
    const req = {
      body: {
        root: currentRoot,
        payload,
        headers,
        tx: {},
        options,
        claims,
        context,
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
      contexts: [context1, context2],
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      context,
      claims,
      eventData: [{ event, number: correctNumber }],
      async: false,
      tx: {
        id: txId,
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
      groupsAdded,
      groupsRemoved,
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
      _tx: txId,
    });
  });
  it("should call with the correct params with no clean or validate, correctNumber, and empty response", async () => {
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
    });

    expect(addFnFake).to.have.been.calledWith({
      domain,
      service,
      eventData: [{ event }],
      async: true,
      tx: {
        id: txId,
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
      _tx: txId,
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
    });

    expect(addFnFake).to.have.been.calledWith({
      domain: eventDomain,
      service: eventService,
      context,
      claims,
      eventData: [{ event, number: correctNumber }],
      tx: {
        id: txId,
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
      _tx: txId,
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        id: txId,
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
      _tx: txId,
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
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        id: txId,
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
      tx: {
        id: txId,
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
      _tx: txId,
    });
  });
  it("should call with the correct params with base network removed from aud", async () => {
    const validateFnFake = fake();
    const normalizeFnFake = fake.returns(cleanedPayload);

    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(commandId).onSecondCall().returns(txId)
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
        tx: {},
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
      txId,
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
      logEventsFn: match(() => true),
      generateRootFn: match(() => true),
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
      tx: {
        id: txId,
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
      _tx: txId,
    });
  });
  it("should redirect correctly with no context", async () => {
    const req = {
      body: {},
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await post({
        contexts: [context],
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This context is forbidden.");
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly with bad context", async () => {
    const req = {
      body: {
        context: {},
      },
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await post({
        contexts: [context],
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This context is forbidden.");
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly with no root and requires root", async () => {
    const req = {
      body: {},
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await post({
        requiresRoot: true,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("A root is required.");
      expect(e).to.equal(error);
    }
  });
});
