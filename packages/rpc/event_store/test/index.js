const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const eventStore = require("..");

const deps = require("../deps");

let clock;

const now = new Date();

const service = "some-service";
const domain = "some-domain";
const root = "some-root";
const parallel = "some-parallel";
const key = "some-key";

const envService = "some-env-service";

process.env.SERVICE = envService;

const context = { a: "some-context" };
const claims = "some-claims";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

const query = {
  key: "some-key",
  value: "some-value",
};

const path = "some-path";
const id = "some-id";
const ip = "some-ip";
const eventData = "some-event-data";

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
      .add({ eventData, tx: { id, ip, path } });

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(postFake).to.have.been.calledWith({
      eventData,
      tx: { id, ip, path, claims },
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
  it("should call add with the right params with event header context and no id or ip", async () => {
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
      .add({ eventData, tx: { path } });
    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(postFake).to.have.been.calledWith({
      eventData,
      tx: { path, claims },
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

    await eventStore({ domain }).add({ eventData });

    expect(rpcFake).to.have.been.calledWith(domain, envService, "event-store");
    expect(postFake).to.have.been.calledWith({ eventData });
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

    const timestamp = "some-timestamp";
    const updatedOnOrAfter = "some-updated-on-or-after";

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
      .aggregateStream(fn, { timestamp, updatedOnOrAfter, parallel, root });

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn, {
      timestamp,
      updatedOnOrAfter,
      parallel,
      root,
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream-aggregates",
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
    const result = await eventStore({ domain, service }).aggregateStream(
      fn,
      {}
    );

    expect(rpcFake).to.have.been.calledWith(domain, service, "event-store");
    expect(streamFake).to.have.been.calledWith(fn);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: `/stream-aggregates`,
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
});
