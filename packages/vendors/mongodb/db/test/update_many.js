const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { updateMany } = require("../index");

const query = "some-query";
const update = "some-update";
const options = "some-options";

describe("Update many", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const updateManyFake = fake.returns(execResult);

    const store = {
      updateMany: updateManyFake,
    };

    const result = await updateMany({ store, query, update });

    expect(result).to.equal(execResult);
    expect(updateManyFake).to.have.been.calledWith(query, update);
  });

  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const updateManyFake = fake.returns(execResult);
    const store = {
      updateMany: updateManyFake,
    };

    const result = await updateMany({ store, query, update, options });

    expect(result).to.equal(execResult);
    expect(updateManyFake).to.have.been.calledWith(query, update, options);
  });
});
