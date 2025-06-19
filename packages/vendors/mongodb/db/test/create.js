import * as chai from "chai";
import { restore, fake } from "sinon";
import { create } from "../index.js";

const { expect } = chai;

const data = "some-data";
const options = "some-options";

describe("create", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const insertManyFake = fake.returns(execResult);
    const store = {
      insertMany: insertManyFake,
    };

    const result = await create({ store, data });

    expect(result).to.equal(execResult);
    expect(insertManyFake).to.have.been.calledWith([data]);
  });
  it("it should return correctly with all optional params unspecified and array data", async () => {
    const execResult = 4;
    const insertManyFake = fake.returns(execResult);
    const store = {
      insertMany: insertManyFake,
    };

    const result = await create({ store, data: [data] });

    expect(result).to.equal(execResult);
    expect(insertManyFake).to.have.been.calledWith([data]);
  });
  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const insertManyFake = fake.returns(execResult);
    const store = {
      insertMany: insertManyFake,
    };

    const result = await create({ store, options, data });

    expect(result).to.equal(execResult);
    expect(insertManyFake).to.have.been.calledWith([data], options);
  });
});
