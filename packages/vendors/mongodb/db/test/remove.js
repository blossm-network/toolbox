import * as chai from "chai";
import { fake, restore } from "sinon";
import { remove } from "../index.js";

const { expect } = chai;

const query = "some-query";

describe("Remove", () => {
  it("should pass the transaction session to the driver", async () => {
    const options = { session: {} };
    const deleteOne = fake.resolves({ deletedCount: 1 });
    await remove({ store: { deleteOne }, query, options });
    expect(deleteOne).to.have.been.calledWith(query, options);
  });
  afterEach(() => {
    restore();
  });
  it("it should return correctly", async () => {
    const execResult = 4;
    const deleteOneFake = fake.returns(execResult);
    const store = {
      deleteOne: deleteOneFake,
    };

    const result = await remove({ store, query });

    expect(result).to.equal(execResult);
    expect(deleteOneFake).to.have.been.calledWith(query);
  });
});
