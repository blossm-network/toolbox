const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { findOne } = require("../index");

const query = "some-query";

describe("Find one", () => {
  afterEach(() => {
    restore();
  });

  it("it should return the correct result", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);
    const store = {
      findOne: findOneFake,
    };
    const result = await findOne({ store, query });

    expect(result).to.equal(execResult);
    expect(findOneFake).to.have.been.calledWith(query, { _id: 0, __v: 0 }, {});
  });
  it("it should return the correct result with inclusive select", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);
    const store = {
      findOne: findOneFake,
    };
    const select = { a: 1 };
    const result = await findOne({ store, query, select });

    expect(result).to.equal(execResult);
    expect(findOneFake).to.have.been.calledWith(query, { a: 1 }, {});
  });
  it("it should return the correct result if select and options is passed", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);

    const store = {
      findOne: findOneFake,
    };

    const sort = "some-sort";
    const select = { a: 0 };
    const options = { b: 2 };
    const result = await findOne({ store, query, select, sort, options });

    expect(findOneFake).to.have.been.calledWith(
      query,
      { a: 0, _id: 0, __v: 0 },
      { sort, b: 2 }
    );
    expect(result).to.equal(execResult);
  });
});
