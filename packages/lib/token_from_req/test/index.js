const { expect } = require("chai");
const tokenFromReq = require("..");

describe("Token from req", () => {
  it("should return the correct token.", () => {
    const token = "some-token-name";
    const req = {
      authorization: {
        scheme: "Bearer",
        credentials: token
      }
    };
    expect(tokenFromReq(req)).to.equal(token);
  });
  it("should return null if the scheme is incorrect.", () => {
    const token = "some-token-name";
    const req = {
      authorization: {
        scheme: "Bear",
        credentials: token
      }
    };
    expect(tokenFromReq(req)).to.be.null;
  });
  it("should return undefined if the credentials are missing.", () => {
    const req = {
      authorization: {
        scheme: "Bearer"
      }
    };
    expect(tokenFromReq(req)).to.be.undefined;
  });
});
