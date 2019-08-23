const { expect } = require("chai");
const validate = require("../src/validate");

const goodParams = {
  payload: {
    account: "some-account-root",
    permissions: [
      {
        domain: "good-domain",
        root: "good-root",
        scope: "read"
      }
    ],
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
  it("should throw if bad permissions are passed", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no permissions are passed", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": undefined
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
  it("should throw if a bad domain is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          domain: 123,
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no domain is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad root is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          domain: "good-domain",
          root: 342
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no root is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          domain: "good-domain"
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad scope is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          domain: "good-domain",
          root: "good-root",
          scope: 123
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no scope is passed in a permission", async () => {
    const params = {
      ...goodParams,
      "payload.permissions": [
        {
          command: "good-command",
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
});
