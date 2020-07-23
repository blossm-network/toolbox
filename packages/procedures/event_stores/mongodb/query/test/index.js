const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub } = require("sinon");

const query = require("..");

const deps = require("../deps");

const root = "some-root";
describe("Mongodb event store query", () => {
  afterEach(() => {
    restore();
  });
  it("should call query with the correct params with snapshot and events found", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];
    const handlers = "some-handlers";

    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns(findEventResult);

    const db = {
      find: findFake,
    };
    replace(deps, "db", db);

    const aggregateResult = {
      root,
      state: { a: 1, b: 2, c: 3, d: 4 },
      lastEventNumber: 2,
    };
    const aggregateResultFake = fake.returns(aggregateResult);
    const aggregateFake = fake.returns(aggregateResultFake);
    replace(deps, "aggregate", aggregateFake);

    const queryFnResult = await query({ eventStore, snapshotStore, handlers })({
      key: "a",
      value: 1,
    });

    expect(aggregateFake).to.have.been.calledWith({
      eventStore,
      snapshotStore,
      handlers,
    });
    expect(aggregateResultFake).to.have.been.calledWith(snapshotRoot);
    expect(aggregateResultFake).to.have.been.calledWith(eventRoot);
    expect(aggregateResultFake).to.have.been.calledTwice;
    expect(findFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "payload.a": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "state.a": 1,
      },
      options: {
        lean: true,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        root,
        state: { a: 1, b: 2, c: 3, d: 4 },
        lastEventNumber: 2,
      },
      {
        root,
        state: { a: 1, b: 2, c: 3, d: 4 },
        lastEventNumber: 2,
      },
    ]);
  });
  it("should call query with the correct params and no snapshot, but events found", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const eventRoot = "some-event-root";
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];
    const handlers = "some-handlers";

    const findFake = stub()
      .onCall(0)
      .returns([])
      .onCall(1)
      .returns(findEventResult);

    const db = {
      find: findFake,
    };
    replace(deps, "db", db);

    const aggregateResult = {
      root,
      state: { a: 1, b: 2, c: 3, d: 4 },
      lastEventNumber: 2,
    };
    const aggregateResultFake = fake.returns(aggregateResult);
    const aggregateFake = fake.returns(aggregateResultFake);
    replace(deps, "aggregate", aggregateFake);

    const queryFnResult = await query({ eventStore, snapshotStore, handlers })({
      key: "a",
      value: 1,
    });

    expect(aggregateResultFake).to.have.been.calledWith(eventRoot);
    expect(aggregateResultFake).to.have.been.calledOnce;
    expect(aggregateFake).to.have.been.calledWith({
      eventStore,
      snapshotStore,
      handlers,
    });
    expect(findFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "payload.a": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "state.a": 1,
      },
      options: {
        lean: true,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        root,
        state: { a: 1, b: 2, c: 3, d: 4 },
        lastEventNumber: 2,
      },
    ]);
  });
  it("should call query with the correct params with snapshot and events found with multipart query", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const snapshotRoot = "some-snapshot-root";
    const eventRoot = "some-event-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const findEventResult = [
      { headers: { root: eventRoot } },
      { headers: { root: eventRoot } },
    ];
    const handlers = "some-handlers";

    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns(findEventResult);

    const db = {
      find: findFake,
    };
    replace(deps, "db", db);

    const aggregateResult = {
      root,
      state: { a: { b: { c: 1 } }, d: "sure", e: true },
      lastEventNumber: 2,
    };
    const aggregateResultFake = fake.returns(aggregateResult);
    const aggregateFake = fake.returns(aggregateResultFake);
    replace(deps, "aggregate", aggregateFake);

    const queryFnResult = await query({ eventStore, snapshotStore, handlers })({
      key: "a.b.c",
      value: 1,
    });

    expect(aggregateFake).to.have.been.calledWith({
      eventStore,
      snapshotStore,
      handlers,
    });
    expect(aggregateResultFake).to.have.been.calledWith(snapshotRoot);
    expect(aggregateResultFake).to.have.been.calledWith(eventRoot);
    expect(aggregateResultFake).to.have.been.calledTwice;
    expect(findFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "payload.a.b.c": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "state.a.b.c": 1,
      },
      options: {
        lean: true,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        root,
        state: { a: { b: { c: 1 } }, d: "sure", e: true },
        lastEventNumber: 2,
      },
      {
        root,
        state: { a: { b: { c: 1 } }, d: "sure", e: true },
        lastEventNumber: 2,
      },
    ]);
  });
  it("should call query with the correct params with snapshot and no events found", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const snapshotRoot = "some-snapshot-root";
    const findSnapshotResult = [{ headers: { root: snapshotRoot } }];
    const handlers = "some-handlers";

    const findFake = stub()
      .onCall(0)
      .returns(findSnapshotResult)
      .onCall(1)
      .returns([]);

    const db = {
      find: findFake,
    };
    replace(deps, "db", db);

    const aggregateResult = {
      root,
      state: { a: 1, b: 2, c: 3, d: 4 },
      lastEventNumber: 2,
    };
    const aggregateResultFake = fake.returns(aggregateResult);
    const aggregateFake = fake.returns(aggregateResultFake);
    replace(deps, "aggregate", aggregateFake);

    const queryFnResult = await query({ eventStore, snapshotStore, handlers })({
      key: "a",
      value: 1,
    });

    expect(aggregateFake).to.have.been.calledWith({
      eventStore,
      snapshotStore,
      handlers,
    });
    expect(aggregateResultFake).to.have.been.calledWith(snapshotRoot);
    expect(aggregateResultFake).to.have.been.calledOnce;
    expect(findFake).to.have.callCount(2);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "payload.a": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        "state.a": 1,
      },
      options: {
        lean: true,
      },
    });

    expect(queryFnResult).to.deep.equal([
      {
        root,
        state: { a: 1, b: 2, c: 3, d: 4 },
        lastEventNumber: 2,
      },
    ]);
  });
  it("should call query with the correct params with no snapshot and no events found", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const handlers = "some-handlers";

    const findFake = stub().onCall(0).returns([]).onCall(1).returns([]);

    const db = {
      find: findFake,
    };
    replace(deps, "db", db);

    const aggregateResult = {
      root,
      state: { a: 1, b: 2, c: 3, d: 4 },
      lastEventNumber: 2,
    };
    const aggregateResultFake = fake.returns(aggregateResult);
    const aggregateFake = fake.returns(aggregateResultFake);
    replace(deps, "aggregate", aggregateFake);

    const queryFnResult = await query({ eventStore, snapshotStore, handlers })({
      key: "a",
      value: 1,
    });

    expect(findFake).to.have.callCount(2);

    expect(queryFnResult).to.deep.equal([]);
  });
  it("should throw if no key is passed in", async () => {
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const handlers = "some-handlers";

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await query({ eventStore, snapshotStore, handlers })({
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
    const eventStore = "some-event-store";
    const snapshotStore = "some-snapshot-store";

    const handlers = "some-handlers";

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await query({ eventStore, snapshotStore, handlers })({
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
