const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");
const aggregate = require("..");

const deps = require("../deps");

const root = "some-root";
const action = "some-action";
const eventHash = "some-event-hash";
const eventId = "some-event-id";
const event = {
  hash: eventHash,
  data: {
    id: eventId,
    root,
    number: 1,
    payload: { b: 2, c: 2 },
    headers: { action },
  },
};
const eachAsyncFake = fake.yields(event);
const cursorFake = fake.returns({
  eachAsync: eachAsyncFake,
});

const handlers = {
  [action]: (state, payload) => {
    return {
      ...state,
      ...payload,
    };
  },
};

const snapshotHash = "some-snapshot-hash";

const findOneResult = {
  hash: snapshotHash,
  data: {
    root,
    state: { a: 1, b: 1 },
    lastEventNumber: 6,
  },
};

const eventStore = "some-event-store";
const snapshotStore = "some-snapshot-store";

describe("Mongodb event store aggregate", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.root": root,
        "data.number": { $gt: 6 },
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledWith(
      match((fn) => {
        const event = {
          data: {
            headers: { action },
          },
        };
        fn(event);
        return true;
      })
    );
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        root,
      },
      sort: {
        created: -1,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      root,
      state: { a: 1, b: 2, c: 2 },
      lastEventNumber: 1,
      events: [event],
      snapshotHash,
    });
  });
  it("should call with the correct params with no events", async () => {
    const eachAsyncFake = fake();
    const otherCursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: otherCursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.root": root,
        "data.number": { $gt: 6 },
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledWith(
      match((fn) => {
        const event = {
          data: {
            headers: { action },
          },
        };
        fn(event);
        return true;
      })
    );
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        root,
      },
      sort: {
        created: -1,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      root,
      state: { a: 1, b: 1 },
      lastEventNumber: 6,
      snapshotHash,
      events: [],
    });
  });
  it("should call with the correct params with no snapshot found", async () => {
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns();

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.root": root,
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(eachAsyncFake).to.have.been.calledWith(
      match((fn) => {
        const event = {
          data: {
            headers: { action },
          },
        };
        fn(event);
        return true;
      })
    );
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        root,
      },
      sort: {
        created: -1,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      root,
      state: { b: 2, c: 2 },
      lastEventNumber: 1,
      events: [event],
    });
  });
  it("should call with the correct params with no snapshot or events found", async () => {
    const eachAsyncFake = fake();
    const otherCursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: otherCursorFake,
    });
    const findOneFake = fake.returns();

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.root": root,
      },
      sort: {
        "data.number": 1,
      },
      options: {
        lean: true,
      },
    });
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        root,
      },
      sort: {
        created: -1,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.be.undefined;
  });
  it("should throw if a handler isn't specified", async () => {
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      find: findFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await aggregate({ handlers: {}, eventStore, snapshotStore })(root);
      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Event handler not specified.",
        {
          info: {
            action,
          },
        }
      );
      expect(e).to.equal(error);
    }
  });
});
