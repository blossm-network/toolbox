const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 2 };

    const params = {
      issuedTimestamp: "123",
      payload
    };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      issuedTimestamp: 123,
      payload
    });
  });
  it("should add a payload", async () => {
    const params = { issuedTimestamp: "123" };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      issuedTimestamp: 123,
      payload: {}
    });
  });
  it("should clean remove unwanted issuerInfo fields", async () => {
    const id = "issuerId!";
    const ip = "123";
    const params = {
      issuedTimestamp: "123",
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
