const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const reserveRootCount = require("..");

const deps = require("../deps");

const root = "some-root";
const amount = 1;
const countsStore = "some-count-store";

describe("Mongodb event store reserve root count", () => {
  afterEach(() => {
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
    });
    expect(writeFake).to.have.been.calledWith({
      store: countsStore,
      query: { root },
      update: {
        $inc: { value: amount },
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
