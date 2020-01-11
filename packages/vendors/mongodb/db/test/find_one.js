const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { findOne } = require("../index");

const query = "some-query";
const select = "some-select";

describe("Find one", () => {
  afterEach(() => {
    restore();
  });

  it("it should return the correct result", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);
    const store = {
      findOne: findOneFake
    };
    const result = await findOne({ store, query });

    expect(result).to.equal(execResult);
    expect(findOneFake).to.have.been.calledWith(query, { _id: 0, __v: 0 }, {});
  });
  it("it should return the correct result if select is passed", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);

    const store = {
      findOne: findOneFake
    };

    const sort = "some-sort";
    const result = await findOne({ store, query, select, sort });

    expect(findOneFake).to.have.been.calledWith(
      query,
      { ...select, _id: 0, __v: 0 },
      { sort }
    );
    expect(result).to.equal(execResult);
  });
});
