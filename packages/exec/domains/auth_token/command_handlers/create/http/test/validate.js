const { expect } = require("chai");
const validate = require("../src/validate");

const goodPayload = {
  principle: "some-other-principle-root",
  audiences: ["audience1", "audience0"],
  context: {
    some: "some-good-context"
  },
  scopes: [
    {
      domain: "*",
      root: "*",
      priviledge: "*"
    }
  ]
};

describe("Validate", () => {
  it("should handle correct payload correctly", async () => {
    expect(await validate(goodPayload)).to.not.throw;
  });
  it("should throw if bad audiences are passed", async () => {
    const payload = {
      ...goodPayload,
      audiences: 123
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if no audiences are passed", async () => {
    const payload = {
      ...goodPayload,
      audiences: undefined
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if bad principle is passed", async () => {
    const payload = {
      ...goodPayload,
      principle: 123
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if no principle is passed", async () => {
    const payload = {
      ...goodPayload,
      principle: undefined
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if bad scopes are passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: 123
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if no scopes are passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: undefined
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if a bad scope domain is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: 123,
          root: "good-root",
          priviledge: "good-priviledge"
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if no scope domain is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: undefined,
          root: "good-root",
          priviledge: "good-priviledge"
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if a bad scope root is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: "good-domain",
          root: 123,
          priviledge: "good-priviledge"
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if no scope root is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: "good-domain",
          root: undefined,
          priviledge: "good-priviledge"
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if a bad scope priviledge is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: "good-domain",
          root: "good-root",
          priviledge: 123
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
  it("should throw if a bad scope priviledge is passed", async () => {
    const payload = {
      ...goodPayload,
      scopes: [
        {
          domain: "good-domain",
          root: "good-root",
          priviledge: undefined
        }
      ]
    };

    expect(async () => await validate(payload)).to.throw;
  });
});
