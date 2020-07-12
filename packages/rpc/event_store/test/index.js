const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const eventStore = require("..");

const deps = require("../deps");
const { string: dateString } = require("@blossm/datetime");

let clock;

const now = new Date();

const payload = {
  a: 1,
  b: 2,
};

const topic = "topic";
const version = "version";
const eventAction = "some-event-action";
const eventDomain = "some-event-domain";
const eventService = "some-event-service";
const path = "some-path";
const service = "some-service";
const domain = "some-domain";
const root = "some-root";
const from = "some-from";
const parallel = "some-parallel";
const key = "some-key";

const envService = "some-env-service";

process.env.SERVICE = envService;

const context = { a: "some-context" };
const claims = "some-claims";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";
const number = "some-number";

const query = {
  key: "some-key",
  value: "some-value",
};

describe("Event store", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call add with the right params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const trace = "trace";

    const enqueueFnResult = "some-enqueue-fn-result";
    const enqueueFnFake = fake.returns(enqueueFnResult);
    const enqueueWait = "some-enqueue-wait";

    await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
        enqueue: {
          fn: enqueueFnFake,
          wait: enqueueWait,
        },
      })
      .add([
        {
          data: {
            root,
            headers: {
              topic,
              action: eventAction,
              domain: eventDomain,
              service: eventService,
              version,
              trace,
              path,
            },
            payload,
          },
          number,
        },
      ]);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(postFake).to.have.been.calledWith({
      events: [
        {
          data: {
            root,
            headers: {
              context,
              claims,
              topic,
              action: eventAction,
              domain: eventDomain,
              service: eventService,
              version,
              path,
              trace,
              created: dateString(),
            },
            payload,
          },
          number,
        },
      ],
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
      enqueueFn: enqueueFnResult,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      queue: `event-store-${service}-${domain}`,
      wait: enqueueWait,
    });
  });
  it("should call add with the right params with event header context", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const trace = "trace";

    await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .add([
        {
          data: {
            root,
            headers: {
              topic,
              action: eventAction,
              domain: eventDomain,
              service: eventService,
              version,
              trace,
              path,
              context: {
                a: 1,
                b: 2,
              },
            },
            payload,
          },
          number,
        },
      ]);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(postFake).to.have.been.calledWith({
      events: [
        {
          data: {
            root,
            headers: {
              context: {
                b: 2,
                a: "some-context",
              },
              claims,
              topic,
              action: eventAction,
              domain: eventDomain,
              service: eventService,
              version,
              path,
              trace,
              created: dateString(),
            },
            payload,
          },
          number,
        },
      ],
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
  });

  it("should call add with the right params and optionals left out", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    await eventStore({ domain }).add([
      {
        data: {
          root,
          headers: {
            topic,
            action: eventAction,
            domain: eventDomain,
            service: eventService,
            version,
          },
          payload,
        },
      },
    ]);

    expect(rpcFake).to.have.been.calledWith(domain, envService, "event-store");
    expect(postFake).to.have.been.calledWith({
      events: [
        {
          data: {
            root,
            headers: {
              topic,
              action: eventAction,
              domain: eventDomain,
              service: eventService,
              version,
              created: dateString(),
            },
            payload,
          },
        },
      ],
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });

  it("should call aggregate with the right params", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const root = "user";

    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .aggregate(root);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(getFake).to.have.been.calledWith({ id: root });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
    expect(result).to.equal(aggregate);
  });
  it("should call aggregate with the right params with optionals missing", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const root = "user";

    const result = await eventStore({ domain }).aggregate(root);

    expect(rpcFake).to.have.been.calledWith(domain, envService, "event-store");
    expect(getFake).to.have.been.calledWith({ id: root });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
    expect(result).to.deep.equal(aggregate);
  });
  it("should call query with the right params", async () => {
    const queryResult = "some-query-result";
    const withFake = fake.returns(queryResult);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .query(query);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
    expect(result).to.equal(queryResult);
  });
  it("should call query with the right params with optionals missing", async () => {
    const queryResult = "some-query-result";
    const withFake = fake.returns(queryResult);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain }).query(query);

    expect(rpcFake).to.have.been.calledWith(domain, envService, "event-store");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
    expect(result).to.equal(queryResult);
  });
  it("should call stream with the right params", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .stream(fn, { root, from, parallel });

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn, {
      id: root,
      from,
      parallel,
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
    expect(result).to.equal(stream);
  });
  it("should call stream with the right params with optionals missing", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const result = await eventStore({ domain, service }).stream(fn, {
      root,
      from,
    });

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn, { id: root, from });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: `/stream`,
    });
    expect(result).to.equal(stream);
  });
  it("should call root stream with the right params", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .rootStream(fn, { parallel });

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn, {
      parallel,
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/roots",
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
    expect(result).to.equal(stream);
  });
  it("should call root stream with the right params with optionals missing", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      stream: streamFake,
    });
    replace(deps, "rpc", rpcFake);

    const fn = "some-fn";
    const result = await eventStore({ domain, service }).rootStream(fn);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: `/roots`,
    });
    expect(result).to.equal(stream);
  });
  it("should call root count with the right params", async () => {
    const count = "some-count";
    const withFake = fake.returns(count);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .count(root);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(getFake).to.have.been.calledWith({
      id: root,
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/count",
      internalTokenFn,
      externalTokenFn,
      key,
      claims,
    });
    expect(result).to.equal(count);
  });
  it("should call root count with the right params with optionals missing", async () => {
    const count = "some-count";
    const withFake = fake.returns(count);
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service }).count(root);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(getFake).to.have.been.calledWith({
      id: root,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/count",
    });
    expect(result).to.equal(count);
  });
  it("should call update proof with the right params", async () => {
    const proof = "some-proof";
    const id = "some-id";
    const withFake = fake.returns(proof);
    const inFake = fake.returns({
      with: withFake,
    });
    const putFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      put: putFake,
    });
    replace(deps, "rpc", rpcFake);

    const enqueueFnResult = "some-enqueue-fn-result";
    const enqueueFnFake = fake.returns(enqueueFnResult);
    const enqueueWait = "some-enqueue-wait";
    const result = await eventStore({ domain, service })
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
        enqueue: {
          fn: enqueueFnFake,
          wait: enqueueWait,
        },
      })
      .updateProof(id);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(putFake).to.have.been.calledWith(id);
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/proof",
      internalTokenFn,
      claims,
      enqueueFn: enqueueFnResult,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      queue: `event-store-${service}-${domain}-proof`,
      wait: enqueueWait,
    });
    expect(result).to.equal(proof);
  });
  it("should call root count with the right params with optionals missing", async () => {
    const proof = "some-proof";
    const id = "some-id";
    const withFake = fake.returns(proof);
    const inFake = fake.returns({
      with: withFake,
    });
    const putFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      put: putFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service }).updateProof(id);

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(putFake).to.have.been.calledWith(id);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/proof",
    });
    expect(result).to.equal(proof);
  });
});
