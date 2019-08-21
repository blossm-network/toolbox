const { expect } = require("chai");
const validate = require("../src/validate");

const goodBody = {
  payload: {
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
    expect(await validate(goodBody)).to.not.throw;
  });
  it("should throw if bad permissions are passed", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no permissions are passed", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if bad metadata are passed", async () => {
    const body = {
      ...goodBody,
      "payload.metadata": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should  throw if no metadata are passed", async () => {
    const body = {
      "payload.metadata": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad domain is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          domain: 123,
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no domain is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad root is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          domain: "good-domain",
          root: 342
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no root is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          domain: "good-domain"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad scope is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          domain: "good-domain",
          root: "good-root",
          scope: 123
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no scope is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          command: "good-command",
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
});
