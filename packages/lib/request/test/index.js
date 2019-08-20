const { expect } = require("chai").use(require("sinon-chai"));
const request = require("../");

const addParamsToUrl = require("../src/add_params_to_url");

describe("Request", () => {
  it("should call post with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";
    const reply = await request.post(url, params);
    expect(reply).to.exist;
  });
  it("should call post with correct params with header", async () => {
    const params = { hello: "there" };
    const headers = { hi: "there" };
    const url = "http://google.com";
    const reply = await request.post(url, params, headers);
    expect(reply).to.exist;
  });

  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const url = "http://google.com";
    const reply = await request.get(url, params);
    expect(reply).to.exist;
  });

  it("should create the right url with params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const url = "http://google.com";
    expect(addParamsToUrl(url, params)).to.equal(
      "http://google.com/andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you"
    );
  });
  it("should create the right url with no params", async () => {
    const url = "http://google.com";
    expect(addParamsToUrl(url)).to.equal("http://google.com/");
  });
});
