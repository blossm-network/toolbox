const { expect } = require("chai");
const tokensFromReq = require("..");

const cookieKey = "some-key";

describe("Tokens from req", () => {
  it("should return the correct bearer token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      cookies: {},
    };
    expect(tokensFromReq(req)).to.deep.equal({ bearer: token });
  });
  it("should return the correct cookie token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {},
      cookies: {
        [cookieKey]: token,
      },
    };
    expect(tokensFromReq(req, { cookieKey })).to.deep.equal({ cookie: token });
  });
  it("should return the correct basic token.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Basic ${token}`,
      },
      cookies: {},
    };
    expect(tokensFromReq(req)).to.deep.equal({ basic: token });
  });
  it("should return the correct cookie token and authorization token.", () => {
    const token = "some-token-name";
    const otherToken = "some-other-token-name";
    const req = {
      headers: {
        authorization: `Bearer ${otherToken}`,
      },
      cookies: {
        [cookieKey]: token,
      },
    };
    expect(tokensFromReq(req, { cookieKey })).to.deep.equal({
      cookie: token,
      bearer: otherToken,
    });
  });
  it("should return null if the scheme is incorrect.", () => {
    const token = "some-token-name";
    const req = {
      headers: {
        authorization: `Bear ${token}`,
      },
      cookies: {},
    };
    expect(tokensFromReq(req)).to.deep.equal({});
  });
  it("should return null if authorization is missing.", () => {
    const req = {
      headers: {},
      cookies: {},
    };
    expect(tokensFromReq(req)).to.deep.equal({});
  });
});
