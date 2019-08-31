const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 2 };

    const params = {
      payload
    };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      payload
    });
  });
  it("should add a payload", async () => {
    const params = {};

    await cleanCommand(params);

    expect(params).to.deep.equal({
      payload: {}
    });
  });
  it("should clean remove unwanted issuerInfo fields", async () => {
    const id = "issuerId!";
    const ip = "123";
    const params = {
      issuerInfo: {
        id,
        ip,
        a: 3,
        b: "23"
      }
    };

    await cleanCommand(params);

    expect(params.issuerInfo).to.deep.equal({
      id,
      ip
    });
  });
});
