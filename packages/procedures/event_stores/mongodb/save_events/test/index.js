const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveEvent = require("..");

const deps = require("../deps");

const createResult = { a: 1 };

const action = "some-action";
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
        data: {
          headers: {
            action,
          },
        },
      },
    ];

    const saveEventsFnResult = await saveEvent({ eventStore, handlers })(
      events
    );
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
      }
    }
    const createFake = fake.rejects(new DuplicateError());

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const events = [
      {
        data: {
          number: "some-number",

          headers: {
            action,
          },
        },
      },
    ];

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "preconditionFailedError", {
      message: messageFake,
    });

    try {
      await saveEvent({ eventStore, handlers })(events);

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Event number duplicate.");
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
        data: {
          headers: {
            action: "bogus",
            number: "some-number",
          },
        },
      },
    ];
    try {
      await saveEvent({ eventStore, handlers })(events);

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
