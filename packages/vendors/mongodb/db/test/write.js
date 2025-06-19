import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { restore, fake } from "sinon";
import { write } from "../index.js";

chai.use(chaiAsPromised);

const { expect } = chai;

const query = "some-query";
const options = "some-options";
const update = "some-update";

describe("write", () => {
  afterEach(() => {
    restore();
  });
  it("it should return correctly with all optional params unspecified", async () => {
    const execResult = 4;
    const findOneAndUpdateFake = fake.returns(execResult);
    const store = {
      findOneAndUpdate: findOneAndUpdateFake,
    };

    const result = await write({ store, query, update });

    expect(result).to.equal(execResult);
    expect(findOneAndUpdateFake).to.have.been.calledWith(query, update);
  });
  it("it should return correctly with all optional params included", async () => {
    const execResult = 4;
    const findOneAndUpdateFake = fake.returns(execResult);
    const store = {
      findOneAndUpdate: findOneAndUpdateFake,
    };

    const result = await write({ store, query, options, update });

    expect(result).to.equal(execResult);
    expect(findOneAndUpdateFake).to.have.been.calledWith(
      query,
      update,
      options
    );
  });
});
