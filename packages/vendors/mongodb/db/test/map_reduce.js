const { expect } = require("chai").use(require("chai-as-promised"));
const { restore, fake } = require("sinon");
const { mapReduce } = require("..");

const query = "some-query";
const map = "some-map-fn";
const reduce = "some-reduce-fn";
const limit = "some-limit";
const sort = "some-sort";
const finalize = "some-finalize-fn";
const out = "some-out";

describe("Map reduce", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly", async () => {
    const execResult = 4;
    const mapReduceFake = fake.returns(execResult);
    const store = {
      mapReduce: mapReduceFake
    };

    const result = await mapReduce({
      store,
      map,
      reduce,
      out
    });

    expect(result).to.equal(execResult);
    expect(mapReduceFake).to.have.been.calledWith({
      map,
      reduce,
      out,
      resolveToObject: true
    });
  });
  it("it should return correctly with added optional params", async () => {
    const execResult = 4;
    const mapReduceFake = fake.returns(execResult);
    const store = {
      mapReduce: mapReduceFake
    };

    const result = await mapReduce({
      store,
      query,
      sort,
      map,
      reduce,
      limit,
      finalize,
      out
    });

    expect(result).to.equal(execResult);
    expect(mapReduceFake).to.have.been.calledWith({
      map,
      reduce,
      sort,
      resolveToObject: true,
      query,
      limit,
      out,
      finalize
    });
  });
});
