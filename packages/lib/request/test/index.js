const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace } = require("sinon");
const deps = require("../deps");
const request = require("..");

describe("Request", () => {
  afterEach(() => {
    restore();
  });
  it("should call post with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";
    const response = "some-response";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "POST",
        json: params
      });
      callback(null, null, response);
    });
    const reply = await request.post(url, params);
    expect(reply).to.equal(response);
  });
  it("should call post with correct params with header", async () => {
    const params = { hello: "there" };
    const headers = { hi: "there" };
    const url = "http://google.com";
    const response = "someResponse";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "POST",
        json: params,
        headers
      });
      callback(null, null, response);
    });
    const reply = await request.post(url, params, headers);
    expect(reply).to.equal(response);
  });

  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const response = "someResponse";
    replace(deps, "request", (fullUrl, callback) => {
      expect(fullUrl).to.equal(
        `${url}?andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you`
      );
      callback(null, null, response);
    });
    const url = "http://google.com";
    const reply = await request.get(url, params);
    expect(reply).to.equal(response);
  });
  it("should call get with correct string params", async () => {
    const params = {
      hello: "there",
      how: "are",
      you: "now"
    };
    const response = "someResponse";
    replace(deps, "request", (fullUrl, callback) => {
      expect(fullUrl).to.equal(`${url}?hello=there&how=are&you=now`);
      callback(null, null, response);
    });
    const url = "http://google.com";
    const reply = await request.get(url, params);
    expect(reply).to.equal(response);
  });
  it("should call get with no params", async () => {
    const response = "someResponse";
    replace(deps, "request", (fullUrl, callback) => {
      expect(fullUrl).to.equal(url);
      callback(null, null, response);
    });
    const url = "http://google.com";
    const reply = await request.get(url);
    expect(reply).to.equal(response);
  });
});
