const { expect } = require("chai").use(require("chai-as-promised"));
const { restore, fake } = require("sinon");
const { create } = require("../index");

const data = "some-data";
const options = "some-options";

describe("create", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const createFake = fake.returns(execResult);
    const store = {
      create: createFake
    };

    const result = await create({ store, data });

    expect(result).to.equal(execResult);
    expect(createFake).to.have.been.calledWith([data]);
  });
  it("it should return correctly with all optional params unspecified and array data", async () => {
    const execResult = 4;
    const createFake = fake.returns(execResult);
    const store = {
      create: createFake
    };

    const result = await create({ store, data: [data] });

    expect(result).to.equal(execResult);
    expect(createFake).to.have.been.calledWith([data]);
  });
  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const createFake = fake.returns(execResult);
    const store = {
      create: createFake
    };

    const result = await create({ store, options, data });

    expect(result).to.equal(execResult);
    expect(createFake).to.have.been.calledWith([data], options);
  });
});
