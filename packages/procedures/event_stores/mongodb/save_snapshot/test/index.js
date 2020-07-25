const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveSnapshot = require("..");

const deps = require("../deps");

const transaction = "some-transaction";
const snapshot = "some-snapshot";
const snapshotStore = "some-snapshot-store";

describe("Mongodb event store save snapshot", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const createResult = "some-create-result";
    const createFake = fake.returns([createResult]);
    const db = {
      create: createFake,
    };
    replace(deps, "db", db);
    const result = await saveSnapshot({ snapshotStore })({
      snapshot,
      transaction,
    });
    expect(createFake).to.have.been.calledWith({
      store: snapshotStore,
      data: snapshot,
      options: { session: transaction, lean: true },
    });
    expect(result).to.deep.equal(createResult);
  });
  it("should call with the correct params with optionals omitted", async () => {
    const createResult = "some-create-result";
    const createFake = fake.returns([createResult]);
    const db = {
      create: createFake,
    };
    replace(deps, "db", db);
    const result = await saveSnapshot({ snapshotStore })({
      snapshot,
    });
    expect(createFake).to.have.been.calledWith({
      store: snapshotStore,
      data: snapshot,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(createResult);
  });
});
