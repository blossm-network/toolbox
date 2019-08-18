const { expect } = require("chai");

const { create } = require("..");

describe("Create", () => {
  it("it should create a jwt token if all variables are passed in", async () => {
    const data = { key: "value" };
    const secret = "secret";
    const options = {
      expiresIn: 5
    };
    const token = await create({ data, secret, options });

    expect(token).to.exist;
  });
});
