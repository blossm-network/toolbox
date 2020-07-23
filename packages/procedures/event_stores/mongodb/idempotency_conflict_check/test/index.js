const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const idempotencyConflictCheck = require("..");

const deps = require("../deps");

const eventStore = "some-event-store";
const idempotency = "some-idempotency";

describe("Mongodb event store idempotency conflict check", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findOneFake = fake.returns();

    const db = {
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await idempotencyConflictCheck({ eventStore })(idempotency);
    expect(findOneFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.idempotency": idempotency,
      },
      select: { "headers.root": 1 },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(false);
  });
  it("should call with the correct params with conflict", async () => {
    const findOneFake = fake.returns("some");

    const db = {
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await idempotencyConflictCheck({ eventStore })(idempotency);
    expect(findOneFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "headers.idempotency": idempotency,
      },
      select: { "headers.root": 1 },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(true);
  });
});
