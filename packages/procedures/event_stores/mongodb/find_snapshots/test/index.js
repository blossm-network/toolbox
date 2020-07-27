const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const findSnapshot = require("..");

const deps = require("../deps");

const snapshotStore = "some-snapshot-store";
const snapshots = "some-snapshots";

describe("Mongodb event store find snapshot store", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns(snapshots);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const query = "some-query";
    const sort = "some-sort";

    const result = await findSnapshot({ snapshotStore })({
      query,
      sort,
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query,
      sort,
      limit: 100,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(snapshots);
  });
  it("should call correctly without optionals", async () => {
    const findFake = fake.returns(snapshots);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const query = "some-query";

    const result = await findSnapshot({ snapshotStore })({
      query,
    });
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query,
      limit: 100,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(snapshots);
  });
});
