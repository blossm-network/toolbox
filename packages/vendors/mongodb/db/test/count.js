const { expect } = require("chai");
const { restore, fake } = require("sinon");
const { count } = require("../index");

const query = "some-query";

describe("Count", () => {
  afterEach(() => {
    restore();
  });
  it("it should return the correct count", async () => {
    const numObjects = 4;
    const countDocumentsFake = fake.returns(numObjects);
    const store = {
      countDocuments: countDocumentsFake,
    };
    const result = await count({ store, query });

    expect(result).to.equal(numObjects);
    expect(countDocumentsFake).to.have.been.calledWith(query);
  });
});
