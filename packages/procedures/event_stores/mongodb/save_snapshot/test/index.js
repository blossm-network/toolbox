const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveSnapshot = require("..");

const deps = require("../deps");

const transaction = "some-transaction";
const hash = "some-hash";
const snapshot = {
  hash,
};
const snapshotStore = "some-snapshot-store";

describe("Mongodb event store save snapshot", () => {
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
    const result = await saveSnapshot({ snapshotStore })({
      snapshot,
      transaction,
    });
    expect(writeFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        hash,
      },
      update: snapshot,
      options: { lean: true, session: transaction },
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
    const result = await saveSnapshot({ snapshotStore })({
      snapshot,
    });
    expect(writeFake).to.have.been.calledWith({
      store: snapshotStore,
      query: {
        hash,
      },
      update: snapshot,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
});
