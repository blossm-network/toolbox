const { expect } = require("chai");
const validate = require("../src/validate");

const goodParams = {
  payload: {
    subject: "some-other-principle-root",
    audiences: ["audience1", "audience0"],
    metadata: {
      a: 1,
      b: 2
    }
  }
};

describe("Validate", () => {
  it("should handle correct params correctly", async () => {
    expect(await validate(goodParams)).to.not.throw;
  });
  it("should throw if bad audiences are passed", async () => {
    const params = {
      ...goodParams,
      "payload.audiences": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no audiences are passed", async () => {
    const params = {
      ...goodParams,
      "payload.audiences": undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if bad subject is passed", async () => {
    const params = {
      ...goodParams,
      "payload.subject": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no subject is passed", async () => {
    const params = {
      ...goodParams,
      "payload.subject": undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if bad metadata are passed", async () => {
    const params = {
      ...goodParams,
      "payload.metadata": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should  throw if no metadata are passed", async () => {
    const params = {
      "payload.metadata": undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
});
