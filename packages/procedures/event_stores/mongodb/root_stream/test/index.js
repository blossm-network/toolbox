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
    const result = await stream({ countsStore })({
      parallel,
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
