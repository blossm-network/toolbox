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
    const execFake = fake.returns(execResult);
    const removeFake = fake.returns({
      exec: execFake
    });
    const store = {
      remove: removeFake,
      exec: execFake
    };

    const result = await remove({ store, query });

    expect(result).to.equal(execResult);
    expect(removeFake).to.have.been.calledWith(query);
  });
});
