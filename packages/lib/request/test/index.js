const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const request = require("../");

describe("Request", () => {
  afterEach(() => {
    restore();
  });
  it("should call post with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";

    const response = "someResponse";
    const requestFake = fake.returns(response);
    replace(deps, "request", requestFake);

    const reply = await request.post(url, params);
    expect(reply).to.equal(response);
    expect(deps.request).to.have.been.calledWith(url, {
      method: "POST",
      data: params,
      json: true
    });
  });
  it("should call post with correct params with header", async () => {
    const params = { hello: "there" };
    const headers = { hi: "there" };
    const url = "http://google.com";
    const response = "someResponse";
    const requestFake = fake.returns(response);
    replace(deps, "request", requestFake);
    const reply = await request.post(url, params, headers);
    expect(reply).to.equal(response);
    expect(deps.request).to.have.been.calledWith(url, {
      method: "POST",
      data: params,
      json: true,
      headers
    });
  });

  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const response = "someResponse";
    const requestFake = fake.returns(response);
    replace(deps, "request", requestFake);
    const url = "http://google.com";
    const reply = await request.get(url, params);
    expect(reply).to.equal(response);
    expect(deps.request).to.have.been.calledWith(
      `${url}?andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you`
    );
  });
  it("should call get with correct string params", async () => {
    const params = {
      hello: "there",
      how: "are",
      you: "now"
    };
    const response = "someResponse";
    const requestFake = fake.returns(response);
    replace(deps, "request", requestFake);
    const url = "http://google.com";
    const reply = await request.get(url, params);
    expect(reply).to.equal(response);
    expect(deps.request).to.have.been.calledWith(
      `${url}?hello=there&how=are&you=now`
    );
  });
  it("should call get with no params", async () => {
    const response = "someResponse";
    const requestFake = fake.returns(response);
    replace(deps, "request", requestFake);
    const url = "http://google.com";
    const reply = await request.get(url);
    expect(reply).to.equal(response);
    expect(deps.request).to.have.been.calledWith(url);
  });
});
