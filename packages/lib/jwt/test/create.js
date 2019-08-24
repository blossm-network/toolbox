const { expect } = require("chai");

const { create } = require("..");

describe("Create", () => {
  it("it should create a jwt token if all variables are passed in", async () => {
    const options = {
      issuer: "some-iss",
      subject: "some-sub",
      audience: "some-aud",
      expiresIn: 50
    };
    const secret = "secret";
    const payload = {
      root: "some-root",
      a: 1
    };
    const token = await create({ payload, secret, options });

    expect(token).to.exist;
  });
});
