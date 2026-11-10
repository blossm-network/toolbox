import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import findSnapshot from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const snapshotStore = "some-snapshot-store";
const snapshots = "some-snapshots";

describe("Mongodb event store find snapshot store", () => {
  afterEach(() => {
    restore();
  });
  it("allows exhaustive root-only candidate lookup without changing the default limit", async () => {
    const findFake = fake.returns(snapshots);
    replace(deps, "db", { aggregate: findFake });
    const query = { "state.a": 1 };
    const select = { "headers.root": 1 };
    expect(
      await findSnapshot({ snapshotStore })({ query, select, limit: null }),
    ).to.equal(snapshots);
    expect(findFake).to.have.been.calledWith({
      store: snapshotStore,
      query,
      select,
      limit: null,
    });
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns(snapshots);

    const db = {
      aggregate: findFake,
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
    });
    expect(result).to.deep.equal(snapshots);
  });
  it("should call correctly without optionals", async () => {
    const findFake = fake.returns(snapshots);

    const db = {
      aggregate: findFake,
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
    });
    expect(result).to.deep.equal(snapshots);
  });
});
