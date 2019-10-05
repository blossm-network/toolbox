const { expect } = require("chai");
const { fake, restore } = require("sinon");
const { remove } = require("../index");

const query = "some-query";

describe("Remove", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly", async () => {
    const execResult = 4;
    const deleteOneFake = fake.returns(execResult);
    const store = {
      deleteOne: deleteOneFake
    };

    const result = await remove({ store, query });

    expect(result).to.equal(execResult);
    expect(deleteOneFake).to.have.been.calledWith(query);
  });
});
