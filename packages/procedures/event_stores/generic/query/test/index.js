const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const query = require("..");

const deps = require("../deps");

const findOneSnapshotFn = "some-find-one-snapshot-fn";
const eventStreamFn = "some-event-stream-fn";
const handlers = "some-handlers";

const root = "some-root";
describe("Mongodb event store query", () => {
  afterEach(() => {
    restore();
  });
  it("should call query with the correct params with snapshot and events found", async () => {
    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const created = "some-created";
    const findSnapshotResult = [{ headers: { root: snapshotRoot, created } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];

    const findSnapshotsFnFake = fake.returns(findSnapshotResult);
    const findEventsFnFake = fake.returns(findEventResult);

    const aggregateResult = {
      state: { a: 1, b: 2, c: 3, d: 4 },
      headers: {
        root,
        lastEventNumber: 2,
      },
    };
    const aggregateFnFake = fake.returns(aggregateResult);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const queryFnResult = await query({
      findEventsFn: findEventsFnFake,
      findSnapshotsFn: findSnapshotsFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: "a",
      value: 1,
    });

    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(snapshotRoot);
    expect(aggregateFnFake.getCall(1)).to.have.been.calledWith(eventRoot);
    expect(aggregateFnFake).to.have.been.calledTwice;
    expect(findEventsFnFake).to.have.been.calledOnceWith({
      query: {
        "payload.a": 1,
      },
      sort: {
        "headers.created": {
          $gt: created,
        },
      },
    });
    expect(findSnapshotsFnFake).to.have.been.calledOnceWith({
      query: {
        "state.a": 1,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: 1, b: 2, c: 3, d: 4 },
        headers: {
          root,
          lastEventNumber: 2,
        },
      },
      {
        headers: {
          root,
          lastEventNumber: 2,
        },
        state: { a: 1, b: 2, c: 3, d: 4 },
      },
    ]);
  });
  it("should call query with the correct params and no snapshot, but events found", async () => {
    const eventRoot = "some-event-root";

    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];

    const findSnapshotsFnFake = fake.returns([]);
    const findEventsFnFake = fake.returns(findEventResult);

    const aggregateResult = {
      state: { a: 1, b: 2, c: 3, d: 4 },
      headers: {
        root,
        lastEventNumber: 2,
      },
    };
    const aggregateFnFake = fake.returns(aggregateResult);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const queryFnResult = await query({
      findEventsFn: findEventsFnFake,
      findSnapshotsFn: findSnapshotsFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: "a",
      value: 1,
    });

    expect(aggregateFnFake).to.have.been.calledOnceWith(eventRoot);
    expect(findEventsFnFake).to.have.been.calledOnceWith({
      query: {
        "payload.a": 1,
      },
    });
    expect(findSnapshotsFnFake).to.have.been.calledOnceWith({
      query: {
        "state.a": 1,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        state: { a: 1, b: 2, c: 3, d: 4 },
        headers: {
          root,
          lastEventNumber: 2,
        },
      },
    ]);
  });
  it("should call query with the correct params with snapshot and events found with multipart query", async () => {
    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const created = "some-created";
    const findSnapshotResult = [{ headers: { root: snapshotRoot, created } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];

    const findSnapshotsFnFake = fake.returns(findSnapshotResult);
    const findEventsFnFake = fake.returns(findEventResult);

    const aggregateResult = {
      headers: {
        root,
        lastEventNumber: 2,
      },
      state: { a: { b: { c: 1 } }, d: "sure", e: true },
    };
    const aggregateFnFake = fake.returns(aggregateResult);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const queryFnResult = await query({
      findEventsFn: findEventsFnFake,
      findSnapshotsFn: findSnapshotsFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: "a.b.c",
      value: 1,
    });

    expect(aggregateFnFake).to.have.been.calledWith(snapshotRoot);
    expect(aggregateFnFake).to.have.been.calledWith(eventRoot);
    expect(aggregateFnFake).to.have.been.calledTwice;
    expect(findEventsFnFake).to.have.been.calledOnceWith({
      query: {
        "payload.a.b.c": 1,
      },
      sort: {
        "headers.created": {
          $gt: created,
        },
      },
    });
    expect(findSnapshotsFnFake).to.have.been.calledWith({
      query: {
        "state.a.b.c": 1,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        headers: {
          root,
          lastEventNumber: 2,
        },
        state: { a: { b: { c: 1 } }, d: "sure", e: true },
      },
      {
        headers: {
          root,
          lastEventNumber: 2,
        },
        state: { a: { b: { c: 1 } }, d: "sure", e: true },
      },
    ]);
  });
  it("should call query with the correct params with snapshot and no events found", async () => {
    const snapshotRoot = "some-snapshot-root";
    const created = "some-created";
    const findSnapshotResult = [{ headers: { root: snapshotRoot, created } }];
    const findEventResult = [];

    const findSnapshotsFnFake = fake.returns(findSnapshotResult);
    const findEventsFnFake = fake.returns(findEventResult);

    const aggregateResult = {
      headers: {
        root,
        lastEventNumber: 2,
      },
      state: { a: 1, b: 2, c: 3, d: 4 },
    };

    const aggregateFnFake = fake.returns(aggregateResult);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const queryFnResult = await query({
      findEventsFn: findEventsFnFake,
      findSnapshotsFn: findSnapshotsFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: "a",
      value: 1,
    });

    expect(aggregateOuterFnFake).to.have.been.calledOnceWith({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    expect(aggregateFnFake).to.have.been.calledOnceWith(snapshotRoot);
    expect(findEventsFnFake).to.have.been.calledWith({
      query: {
        "payload.a": 1,
      },
      sort: {
        "headers.created": {
          $gt: created,
        },
      },
    });
    expect(findSnapshotsFnFake).to.have.been.calledWith({
      query: {
        "state.a": 1,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        headers: {
          root,
          lastEventNumber: 2,
        },
        state: { a: 1, b: 2, c: 3, d: 4 },
      },
    ]);
  });
  it("should call query with the correct params with no snapshot and no events found", async () => {
    const findSnapshotsFnFake = fake.returns([]);
    const findEventsFnFake = fake.returns([]);

    const queryFnResult = await query({
      findEventsFn: findEventsFnFake,
      findSnapshotsFn: findSnapshotsFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    })({
      key: "a",
      value: 1,
    });

    expect(findEventsFnFake).to.have.been.calledOnce;
    expect(findSnapshotsFnFake).to.have.been.calledOnce;

    expect(queryFnResult).to.deep.equal([]);
  });
  it("should throw if no key is passed in", async () => {
    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await query({})({
        value: 1,
      });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The query is missing a key or value.",
        {
          info: { key: undefined, value: 1 },
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw if no value is passed in", async () => {
    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await query({})({
        key: "a",
      });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "The query is missing a key or value.",
        {
          info: { key: "a", value: undefined },
        }
      );
      expect(e).to.equal(error);
    }
  });
});
