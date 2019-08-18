const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 1 };

    const body = {
      payload
    };

    await cleanCommand(body);

    expect(body).to.deep.equal({
      payload
    });
  });
  it("should add a payload", async () => {
    const body = {};

    await cleanCommand(body);

    expect(body).to.deep.equal({
      payload: {}
    });
  });
  it("should clean remove unwanted issuerInfo fields", async () => {
    const id = "issuerId!";
    const ip = "123";
    const body = {
      issuerInfo: {
        id,
        ip,
        a: 3,
        b: "23"
      }
    };

    await cleanCommand(body);

    expect(body.issuerInfo).to.deep.equal({
      id,
      ip
    });
  });
});
