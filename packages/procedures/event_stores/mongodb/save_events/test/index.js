const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveEvent = require("..");

const deps = require("../deps");

const createResult = { a: 1 };

const action = "some-action";
const transaction = "some-transaction";
const handlers = { [action]: () => {} };

describe("Mongodb event store create event", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const eventStore = "some-event-store";

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        headers: {
          action,
        },
      },
    ];

    const saveEventsFnResult = await saveEvent({ eventStore, handlers })({
      events,
      transaction,
    });
    expect(createFake).to.have.been.calledWith({
      store: eventStore,
      data: events,
      options: {
        session: transaction,
      },
    });
    expect(saveEventsFnResult).to.deep.equal([createResult]);
  });
  it("should call with the correct params with optionals omitted", async () => {
    const eventStore = "some-event-store";

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        headers: {
          action,
        },
      },
    ];

    const saveEventsFnResult = await saveEvent({ eventStore, handlers })({
      events,
    });
    expect(createFake).to.have.been.calledWith({
      store: eventStore,
      data: events,
    });
    expect(saveEventsFnResult).to.deep.equal([createResult]);
  });
  it("should throw correct error when events have a duplicate id", async () => {
    const eventStore = "some-event-store";

    class DuplicateError extends Error {
      constructor() {
        super();
        this.code = 11000;
        this.writeErrors = [
          {
            errmsg: "asdfasdf asdf asdf key: { some-key: 'some-value' }",
          },
        ];
      }
    }

    const thrownError = new DuplicateError();
    const createFake = fake.rejects(thrownError);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        number: "some-number",
        headers: {
          action,
        },
      },
    ];

    const error = new Error();

    const messageFake = fake.returns(error);
    replace(deps, "preconditionFailedError", {
      message: messageFake,
    });

    try {
      await saveEvent({ eventStore, handlers })({ events });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Duplicates.", {
        info: [{ "some-key": "some-value" }],
        cause: thrownError,
      });
      expect(e).to.equal(error);
    }
  });
  it("should throw if not 11000", async () => {
    const eventStore = "some-event-store";

    class SomeError extends Error {
      constructor() {
        super();
        this.code = 3333;
        this.writeErrors = [
          {
            errmsg: "asdfasdf asdf asdf key: { some-key: 'some-value' }",
          },
        ];
      }
    }

    const thrownError = new SomeError();
    const createFake = fake.rejects(thrownError);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        number: "some-number",
        headers: {
          action,
        },
      },
    ];

    try {
      await saveEvent({ eventStore, handlers })({ events });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(thrownError);
    }
  });
  it("should throw correct error when events have a duplicate id and idempotency", async () => {
    const eventStore = "some-event-store";

    class DuplicateError extends Error {
      constructor() {
        super();
        this.code = 11000;
        this.writeErrors = [
          {
            errmsg: "asdfasdf asdf asdf key: { some-key: 'some-value' }",
          },
          {
            errmsg:
              "asdfasdf asdf asdf key: { data.idempotency: 'some-idempotency' }",
          },
        ];
      }
    }

    const thrownError = new DuplicateError();
    const createFake = fake.rejects(thrownError);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        number: "some-number",
        headers: {
          action,
        },
      },
    ];

    const error = new Error();

    const messageFake = fake.returns(error);
    replace(deps, "preconditionFailedError", {
      message: messageFake,
    });

    try {
      await saveEvent({ eventStore, handlers })({ events });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Duplicates.", {
        info: [
          { "some-key": "some-value" },
          { "data.idempotency": "some-idempotency" },
        ],
        cause: thrownError,
      });
      expect(e).to.equal(error);
    }
  });
  it("should throw if adding event with unrecognized action", async () => {
    const eventStore = "some-event-store";

    const createFake = fake.returns([{ ...createResult, __v: 3, _id: 4 }]);

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    const events = [
      {
        headers: {
          action: "bogus",
          number: "some-number",
        },
      },
    ];
    try {
      await saveEvent({ eventStore, handlers })({ events });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Event handler not specified."
      );
      expect(e).to.equal(error);
    }
  });
});
