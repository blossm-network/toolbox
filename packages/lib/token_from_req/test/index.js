const { expect } = require("chai");
const tokenFromReq = require("..");

describe("Token from req", () => {
  it("should return the correct token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    expect(tokenFromReq(req)).to.equal(token);
  });
  it("should return null if the scheme is incorrect.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bear ${token}`
      }
    };
    expect(tokenFromReq(req)).to.be.null;
  });
  it("should return null if authorization is missing.", () => {
    const req = {
      headers: {}
    };
    expect(tokenFromReq(req)).to.be.null;
  });
});
