const { expect } = require("chai").use(require("chai-as-promised"));
const { restore, fake } = require("sinon");
const { mapReduce } = require("..");

const query = "some-query";
const mapFn = "some-map-fn";
const reduceFn = "some-reduce-fn";
const finalizeFn = "some-finalize-fn";
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
      query,
      mapFn,
      reduceFn,
      finalizeFn,
      out
    });

    expect(result).to.equal(execResult);
    expect(mapReduceFake).to.have.been.calledWith(mapFn, reduceFn, {
      query,
      out,
      finalize: finalizeFn
    });
  });
});
