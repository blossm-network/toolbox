import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import stream from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const countsStore = "some-counts-store";
const parallel = "some-parallel";
const fn = "some-fn";

describe("Mongodb event store root stream", () => {
  afterEach(() => {
    restore();
  });
  it("streams dirty counts using only the latest snapshot number and retains stream options", async () => {
    const eachAsync = fake.resolves("stream-result");
    const cursor = fake.returns({ eachAsync });
    const aggregate = fake.returns({ cursor });
    const updatedOnOrAfter = "2026-01-01T00:00:00.000Z";
    const updatedBefore = "2026-01-02T00:00:00.000Z";
    const result = await stream({
      countsStore: { aggregate },
      snapshotStore: { collection: { name: "snapshots" } },
    })({
      unsnapshottedOnly: true,
      transaction: "transaction-session",
      fn,
      parallel: 2,
      reverse: true,
      limit: 3,
      updatedOnOrAfter,
      updatedBefore,
    });
    expect(aggregate.firstCall.args[0]).to.deep.equal([
      {
        $match: {
          updated: {
            $gte: new Date(updatedOnOrAfter),
            $lt: new Date(updatedBefore),
          },
        },
      },
      {
        $lookup: {
          from: "snapshots",
          let: { root: "$root" },
          pipeline: [
            { $match: { $expr: { $eq: ["$headers.root", "$$root"] } } },
            { $sort: { "headers.number": -1, "headers.created": -1 } },
            { $limit: 1 },
            { $project: { "headers.lastEventNumber": 1, _id: 0 } },
          ],
          as: "snapshot",
        },
      },
      {
        $match: {
          $expr: {
            $gt: [
              "$value",
              {
                $add: [
                  {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$snapshot.headers.lastEventNumber", 0],
                      },
                      -1,
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      { $sort: { updated: 1, root: 1 } },
      { $limit: 3 },
      { $project: { root: 1, value: 1, updated: 1, _id: 0 } },
    ]);
    expect(aggregate.firstCall.args[1]).to.deep.equal({ session: "transaction-session" });
    expect(cursor).to.have.been.calledWith();
    expect(eachAsync).to.have.been.calledWith(fn, { parallel: 2 });
    expect(result).to.equal("stream-result");
  });
  it("should call with the correct params", async () => {
    const streamResult = "stream-result";
    const eachAsyncFake = fake.returns(streamResult);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const updatedOnOrAfter = "some-updated-on-or-after";
    const updatedBefore = "some-updated-before";
    const reverse = true;
    const limit = "some-limit";
    const transaction = {};
    const result = await stream({ countsStore })({
      parallel,
      transaction,
      updatedOnOrAfter,
      updatedBefore,
      limit,
      reverse,
      fn,
    });
    expect(findFake).to.have.been.calledWith({
      store: countsStore,
      query: {
        updated: {
          $gte: updatedOnOrAfter,
          $lt: updatedBefore,
        },
      },
      sort: {
        updated: 1,
        root: 1,
      },
      limit,
      options: {
        lean: true,
        session: transaction,
      },
    });
    expect(cursorFake).to.have.been.calledWith();
    expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel });
    expect(result).to.deep.equal(streamResult);
  });
  it("should call with the correct params an optionals missing", async () => {
    const streamResult = "stream-result";
    const eachAsyncFake = fake.returns(streamResult);
    const cursorFake = fake.returns({
      eachAsync: eachAsyncFake,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await stream({ countsStore })({
      fn,
    });

    expect(findFake).to.have.been.calledWith({
      store: countsStore,
      query: {},
      sort: {
        updated: -1,
        root: 1,
      },
      options: {
        lean: true,
      },
    });
    expect(cursorFake).to.have.been.calledWith();
    expect(eachAsyncFake).to.have.been.calledWith(fn, { parallel: 1 });
    expect(result).to.deep.equal(streamResult);
  });
});
