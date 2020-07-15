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
    const findFake = fake.returns([]);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await idempotencyConflictCheck({ eventStore })(idempotency);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.headers.idempotency": idempotency,
      },
      limit: 1,
      select: { root: 1 },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(false);
  });
  it("should call with the correct params with conflict", async () => {
    const findFake = fake.returns(["some"]);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await idempotencyConflictCheck({ eventStore })(idempotency);
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query: {
        "data.headers.idempotency": idempotency,
      },
      limit: 1,
      select: { root: 1 },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(true);
  });
});
