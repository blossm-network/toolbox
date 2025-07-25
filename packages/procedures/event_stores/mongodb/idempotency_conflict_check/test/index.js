import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import idempotencyConflictCheck from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

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
