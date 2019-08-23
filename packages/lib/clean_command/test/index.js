const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 1 };

    const body = {
      issuedTimestamp: "123",
      payload
    };

    await cleanCommand(body);

    expect(body).to.deep.equal({
      issuedTimestamp: 123,
      payload
    });
  });
  it("should add a payload", async () => {
    const body = { issuedTimestamp: "123" };

    await cleanCommand(body);

    expect(body).to.deep.equal({
      issuedTimestamp: 123,
      payload: {}
    });
  });
  it("should clean remove unwanted issuerInfo fields", async () => {
    const id = "issuerId!";
    const ip = "123";
    const body = {
      issuedTimestamp: "123",
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
