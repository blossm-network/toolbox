const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const request = require("..");

const statusCode = "some-status-code";
const statusMessage = "some-status-message";
const headers = "some-headers";
const response = {
  statusCode,
  statusMessage,
  headers
};
const body = "some-body";

describe("Request", () => {
  afterEach(() => {
    restore();
  });
  it("should call post with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "POST",
        json: params
      });
      callback(null, response, body);
    });
    const reply = await request.post(url, { body: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call post with correct params with header", async () => {
    const params = { hello: "there" };
    const reqHeaders = { hi: "there" };
    const url = "http://google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "POST",
        json: params,
        headers: reqHeaders
      });
      callback(null, response, body);
    });
    const reply = await request.post(url, {
      body: params,
      headers: reqHeaders
    });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call put with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "PUT",
        json: params
      });
      callback(null, response, body);
    });
    const reply = await request.put(url, { body: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call delete with correct params", async () => {
    const url = "http://google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "DELETE"
      });
      callback(null, response, body);
    });
    const reply = await request.delete(url);
    expect(reply).to.deep.equal({ ...response, body });
  });

  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"],
      dandy: { a: 1 }
    };
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(
        `${url}?andy=0&andy=ur%20dogs%3F&dandy=a%3D1&hello=there&how=are&how=you`
      );
      callback(null, response, body);
    });
    const url = "http://google.com";
    const reply = await request.get(url, { query: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call get with correct params and header", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const headers = "some-header!";
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(
        `${url}?andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you`
      );
      expect(options.headers).to.equal(headers);
      callback(null, response, body);
    });
    const url = "http://google.com";
    const reply = await request.get(url, { query: params, headers });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call get with correct string params", async () => {
    const params = {
      hello: "there",
      how: "are",
      you: "now"
    };
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(`${url}?hello=there&how=are&you=now`);
      callback(null, response, body);
    });
    const url = "http://google.com";
    const reply = await request.get(url, { query: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call get with no params", async () => {
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(url);
      callback(null, response, body);
    });
    const url = "http://google.com";
    const reply = await request.get(url);
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call stream with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const onFn = (status, fn) => {
      switch (status) {
        case "error":
          return { on: onFn };
        case "data":
          fn(body);
          return { on: onFn };
        case "end":
          fn();
          break;
      }
    };
    replace(deps, "request", options => {
      expect(options.url).to.equal(
        `${url}?andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you`
      );
      return {
        on: onFn
      };
    });
    const url = "http://google.com";
    const onDataFake = fake();
    await request.stream(url, onDataFake, { query: params });
    expect(onDataFake).to.have.been.calledWith(body);
  });
  it("should throw in stream correctly", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"]
    };
    const errorMessage = "some-error-message";
    const onFn = (status, fn) => {
      switch (status) {
        case "error":
          fn(new Error(errorMessage));
          return;
        case "data":
          fn(body);
          return { on: onFn };
        case "end":
          fn();
          break;
      }
    };
    replace(deps, "request", options => {
      expect(options.url).to.equal(
        `${url}?andy=0&andy=ur%20dogs%3F&hello=there&how=are&how=you`
      );
      return {
        on: onFn
      };
    });
    const url = "http://google.com";
    const onDataFake = fake();
    try {
      await request.stream(url, onDataFake, { query: params });

      //shouldn't get called
      expect(0).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
