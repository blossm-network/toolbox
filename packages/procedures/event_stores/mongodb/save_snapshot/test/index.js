import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import saveSnapshot from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

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
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
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
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
});
