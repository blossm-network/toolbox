const { expect } = require("chai");
const validate = require("../src/validate");

const goodParams = {
  payload: {
    issuer: "some-principle-root",
    subject: "some-other-principle-root",
    audience: [
      {
        domain: "good-domain",
        service: "good-service",
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
  it("should throw if bad audience are passed", async () => {
    const params = {
      ...goodParams,
      "payload.audience": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no audience are passed", async () => {
    const params = {
      ...goodParams,
      "payload.audience": undefined
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if bad issuer is passed", async () => {
    const params = {
      ...goodParams,
      "payload.issuer": 123
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no issuer is passed", async () => {
    const params = {
      ...goodParams,
      "payload.issuer": undefined
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
  it("should throw if a bad domain is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          domain: 123
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no domain is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          domain: undefined
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad root is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          root: 342
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no root is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          root: undefined
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad scope is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          scope: 123
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no scope is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          scope: undefined
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if a bad service is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          service: 123
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
  it("should throw if no scope is passed in a audience", async () => {
    const params = {
      ...goodParams,
      "payload.audience": [
        {
          ...goodParams.payload.audience,
          service: undefined
        }
      ]
    };

    expect(async () => await validate(params)).to.throw;
  });
});
