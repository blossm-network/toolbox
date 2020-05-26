const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const count = require("..");

const deps = require("../deps");

const countsStore = "some-counts-store";
const root = "some-root";
const value = "some-value";

describe("Mongodb event store root stream", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns([{ value }]);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await count({ countsStore })({
      root,
    });
    expect(findFake).to.have.been.calledWith({
      store: countsStore,
      query: { root },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(value);
  });
  it("should call with the correct params if root not found", async () => {
    const findFake = fake.returns([]);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await count({ countsStore })({
      root,
    });
    expect(findFake).to.have.been.calledWith({
      store: countsStore,
      query: { root },
      options: {
        lean: true,
      },
    });
    expect(result).to.equal(0);
  });
});
