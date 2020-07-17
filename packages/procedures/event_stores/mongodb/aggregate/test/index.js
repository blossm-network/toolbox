const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");
const aggregate = require("..");

const deps = require("../deps");

const root = "some-root";
const action = "some-action";
const eachAsyncFake = fake.yields({
  data: {
    root,
    number: 1,
    payload: { b: 2, c: 2 },
    headers: { action },
  },
});
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
const findOneResult = {
  root,
  state: { a: 1, b: 1 },
  lastEventNumber: 6,
};

const eventStore = "some-event-store";
const snapshotStore = "some-snapshot-store";

describe("Mongodb event store aggregate", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const streamFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      stream: streamFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(streamFake).to.have.been.calledWith({
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
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      root,
      state: { a: 1, b: 2, c: 2 },
      lastEventNumber: 1,
    });
  });
  it("should call with the correct params with no snapshot found", async () => {
    const streamFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns();

    const db = {
      stream: streamFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(streamFake).to.have.been.calledWith({
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
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal({
      root,
      state: { b: 2, c: 2 },
      lastEventNumber: 1,
    });
  });
  it("should call with the correct params with no snapshot or events found", async () => {
    const eachAsyncFake = fake();
    const otherCursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const streamFake = fake.returns({
      cursor: otherCursorFake,
    });
    const findOneFake = fake.returns();

    const db = {
      stream: streamFake,
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await aggregate({ handlers, eventStore, snapshotStore })(
      root
    );

    expect(streamFake).to.have.been.calledWith({
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
      options: {
        lean: true,
      },
    });
    expect(result).to.be.undefined;
  });
  it("should throw if a handler isn't specified", async () => {
    const streamFake = fake.returns({
      cursor: cursorFake,
    });
    const findOneFake = fake.returns(findOneResult);

    const db = {
      stream: streamFake,
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
