const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const findSnapshot = require("..");

const deps = require("../deps");

const snapshotStore = "some-snapshot-store";
const snapshot = "some-snapshots";

describe("Mongodb event store find one snapshot store", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findOneFake = fake.returns(snapshot);

    const db = {
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const query = "some-query";
    const sort = "some-sort";
    const select = "some-select";

    const result = await findSnapshot({ snapshotStore })({
      query,
      sort,
      select,
    });
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query,
      sort,
      select,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(snapshot);
  });
  it("should call with the correct params without optionals", async () => {
    const findOneFake = fake.returns(snapshot);

    const db = {
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const query = "some-query";

    const result = await findSnapshot({ snapshotStore })({
      query,
    });
    expect(findOneFake).to.have.been.calledWith({
      store: snapshotStore,
      query,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(snapshot);
  });
});
