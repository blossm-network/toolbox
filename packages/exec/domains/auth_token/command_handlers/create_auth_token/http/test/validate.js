const { expect } = require("chai");
const validate = require("../src/validate");

const goodBody = {
  payload: {
    permissions: [
      {
        command: "good-command",
        root: "good-root"
      }
    ],
    metadata: {
      a: 1,
      b: 2
    },
    account: "good-account-root"
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
  it("should throw if a bad account is passed", async () => {
    const body = {
      ...goodBody,
      "payload.account": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no account is passed", async () => {
    const body = {
      ...goodBody,
      "payload.account": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad command is passed in a permission", async () => {
    const body = {
      ...goodBody,
      "payload.permissions": [
        {
          command: 123,
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no command is passed in a permission", async () => {
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
          command: "good-command",
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
          root: "good-root"
        }
      ]
    };

    expect(async () => await validate(body)).to.throw;
  });
});
