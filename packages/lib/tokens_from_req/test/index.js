const { expect } = require("chai");
const tokensFromReq = require("..");

describe("Tokens from req", () => {
  it("should return the correct bearer token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    expect(tokensFromReq(req)).to.deep.equal({ bearer: token });
  });
  it("should return the correct basic token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Basic ${token}`
      }
    };
    expect(tokensFromReq(req)).to.deep.equal({ basic: token });
  });
  it("should return null if the scheme is incorrect.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bear ${token}`
      }
    };
    expect(tokensFromReq(req)).to.deep.equal({});
  });
  it("should return null if authorization is missing.", () => {
    const req = {
      headers: {}
    };
    expect(tokensFromReq(req)).to.deep.equal({});
  });
});
