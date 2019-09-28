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
    const execFake = fake.returns(execResult);
    const findOneFake = fake.returns({
      exec: execFake
    });
    const store = {
      findOne: findOneFake
    };
    const result = await findOne({ store, query });

    expect(result).to.equal(execResult);
    expect(findOneFake).to.have.been.calledWith(query);
    expect(execFake).to.have.been.calledOnce;
  });
  it("it should return the correct result if select is passed", async () => {
    const execResult = 4;
    const execFake = fake.returns(execResult);
    const selectFake = fake();
    const findOneFake = fake.returns({
      exec: execFake,
      select: selectFake
    });

    const store = {
      findOne: findOneFake
    };

    const result = await findOne({ store, query, select });

    expect(selectFake).to.have.been.calledWith(select);
    expect(findOneFake).to.have.been.calledWith(query);
    expect(result).to.equal(execResult);
  });
});
