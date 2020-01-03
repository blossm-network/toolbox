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
    expect(findOneFake).to.have.been.calledWith(query, { _id: 0 }, null);
  });
  it("it should return the correct result if select is passed", async () => {
    const execResult = 4;
    const findOneFake = fake.returns(execResult);

    const store = {
      findOne: findOneFake
    };

    const options = "some-options";
    const result = await findOne({ store, query, select, options });

    expect(findOneFake).to.have.been.calledWith(
      query,
      { ...select, _id: 0 },
      options
    );
    expect(result).to.equal(execResult);
  });
});
