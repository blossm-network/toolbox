const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const reserveRootCount = require("..");

const deps = require("../deps");

const root = "some-root";
const amount = 1;
const transaction = "some-transaction";
const countsStore = "some-count-store";

let clock;
const now = new Date();

describe("Mongodb event store reserve root count", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should call with the correct params", async () => {
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);

    const db = {
      write: writeFake,
    };
    replace(deps, "db", db);

    const result = await reserveRootCount({ countsStore })({
      root,
      amount,
      transaction,
    });
    expect(writeFake).to.have.been.calledWith({
      store: countsStore,
      query: { root },
      update: {
        $inc: { value: amount },
        $set: {
          updated: deps.dateString(),
        },
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        session: transaction,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
  it("should call with the correct params with optionals omitted", async () => {
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);

    const db = {
      write: writeFake,
    };
    replace(deps, "db", db);

    const result = await reserveRootCount({ countsStore })({
      root,
      amount,
    });
    expect(writeFake).to.have.been.calledWith({
      store: countsStore,
      query: { root },
      update: {
        $inc: { value: amount },
        $set: {
          updated: deps.dateString(),
        },
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
});
