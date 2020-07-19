const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub } = require("sinon");
const { Readable } = require("streamx");
const deps = require("../deps");
const request = require("..");

const statusCode = "some-status-code";
const statusMessage = "some-status-message";
const headers = "some-headers";
const response = {
  statusCode,
  statusMessage,
  headers,
};
const body = "some-body";
const resultingUrl = "some-resulting-url";

describe("Request", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });
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
        json: params,
      });
      callback(null, response, body);
    });
    const reply = await request.post(url, { body: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call post with correct params without http and not in local env", async () => {
    const params = { hello: "there" };
    const url = "google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url: `https://${url}`,
        method: "POST",
        json: params,
      });
      callback(null, response, body);
    });
    const reply = await request.post(url, { body: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call post with correct params without http in local env", async () => {
    const params = { hello: "there" };
    const url = "google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url: `http://${url}`,
        method: "POST",
        json: params,
      });
      callback(null, response, body);
    });
    process.env.NODE_ENV = "local";
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
        headers: reqHeaders,
      });
      callback(null, response, body);
    });
    const reply = await request.post(url, {
      body: params,
      headers: reqHeaders,
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
        json: params,
      });
      callback(null, response, body);
    });
    const reply = await request.put(url, { body: params });
    expect(reply).to.deep.equal({ ...response, body });
  });
  it("should call delete with correct params", async () => {
    const params = { hello: "there" };
    const url = "http://google.com";
    replace(deps, "request", (options, callback) => {
      expect(options).to.deep.equal({
        url,
        method: "DELETE",
        json: params,
      });
      callback(null, response, body);
    });
    const reply = await request.delete(url, { query: params });
    expect(reply).to.deep.equal({ ...response, body });
  });

  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"],
      dandy: { a: 1 },
    };
    const urlEncodeQueryDataFake = fake.returns(resultingUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(`https://${resultingUrl}`);
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
      andy: [0, "ur dogs?"],
    };
    const headers = "some-header!";
    const urlEncodeQueryDataFake = fake.returns(resultingUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(`https://${resultingUrl}`);
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
      you: "now",
    };
    const urlEncodeQueryDataFake = fake.returns(resultingUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);
    replace(deps, "request", (options, callback) => {
      expect(options.url).to.equal(`https://${resultingUrl}`);
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
      andy: [0, "ur dogs?"],
    };
    const onDataFn = (status, fn) => {
      switch (status) {
        case "error":
          return { on: onDataFn };
        case "data":
          fn(body);
          return { on: onDataFn };
        case "end":
          fn();
          break;
      }
    };
    const urlEncodeQueryDataFake = fake.returns(resultingUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);
    replace(deps, "request", (options) => {
      expect(options.url).to.equal(resultingUrl);
      return {
        on: onDataFn,
      };
    });
    const url = "http://google.com";
    const onDataFnFake = fake();
    await request.stream(url, onDataFnFake, { query: params });
    expect(onDataFnFake).to.have.been.calledWith(body);
  });
  it("should throw in stream correctly", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"],
    };
    const errorMessage = "some-error-message";
    const onDataFn = (status, fn) => {
      switch (status) {
        case "error":
          fn(new Error(errorMessage));
          return;
        case "data":
          fn(body);
          return { on: onDataFn };
        case "end":
          fn();
          break;
      }
    };
    const urlEncodeQueryDataFake = fake.returns(resultingUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);
    replace(deps, "request", (options) => {
      expect(options.url).to.equal(resultingUrl);
      return {
        on: onDataFn,
      };
    });
    const url = "http://google.com";
    const onDataFnFake = fake();
    try {
      await request.stream(url, onDataFnFake, { query: params });

      //shouldn't get called
      expect(0).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should call stream many with correct params if original streams are sorted", async () => {
    const sortFn = (a, b) => {
      return a.a < b.a ? -1 : a.a > b.a ? 1 : 0;
    };

    const resultingUrl0 = "some-resulting-url0";
    const resultingUrl1 = "some-resulting-url1";
    const resultingUrl2 = "some-resulting-url2";
    const resultingUrl3 = "some-resulting-url3";
    const resultingUrl4 = "some-resulting-url4";

    const urlEncodeQueryDataFake = stub()
      .onCall(0)
      .returns(resultingUrl0)
      .onCall(1)
      .returns(resultingUrl1)
      .onCall(2)
      .returns(resultingUrl2)
      .onCall(3)
      .returns(resultingUrl3)
      .onCall(4)
      .returns(resultingUrl4);

    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const requestFake = stub()
      .onCall(0)
      .returns(Readable.from([{ a: 2 }, { a: 5 }]))
      .onCall(1)
      .returns(Readable.from([{ a: 1 }, { a: 6 }]))
      .onCall(2)
      .returns(Readable.from([{ a: 3 }, { a: 4 }]))
      .onCall(3)
      .returns(Readable.from([{ a: 7 }, { a: 9 }]))
      .onCall(4)
      .returns(Readable.from([{ a: 8 }, { a: 10 }]));

    replace(deps, "request", requestFake);
    const url0 = "http://google.com";
    const query0 = "some-query";
    const headers0 = "some-headers";
    const url1 = "http://gogle.com";
    const query1 = "some-other-query";
    const headers1 = "some-other-headers";
    const url2 = "http://ggle.com";
    const query2 = "another-query";
    const headers2 = "another-headers";
    const url3 = "http://gle.com";
    const query3 = "yet-another-query";
    const headers3 = "yet-another-headers";
    const url4 = "http://le.com";
    const query4 = "even-another-query";
    const headers4 = "even-another-headers";
    const onDataFnFake = fake();
    const requests = [
      { url: url0, query: query0, headers: headers0 },
      { url: url1, query: query1, headers: headers1 },
      { url: url2, query: query2, headers: headers2 },
      { url: url3, query: query3, headers: headers3 },
      { url: url4, query: query4, headers: headers4 },
    ];
    await request.streamMany(requests, onDataFnFake, sortFn);
    expect(requestFake.getCall(0)).to.have.been.calledWith({
      url: resultingUrl0,
      method: "GET",
      headers: headers0,
    });
    expect(requestFake.getCall(1)).to.have.been.calledWith({
      url: resultingUrl1,
      method: "GET",
      headers: headers1,
    });
    expect(requestFake.getCall(2)).to.have.been.calledWith({
      url: resultingUrl2,
      method: "GET",
      headers: headers2,
    });
    expect(requestFake.getCall(3)).to.have.been.calledWith({
      url: resultingUrl3,
      method: "GET",
      headers: headers3,
    });
    expect(requestFake.getCall(4)).to.have.been.calledWith({
      url: resultingUrl4,
      method: "GET",
      headers: headers4,
    });
    expect(requestFake).to.have.callCount(5);
    expect(onDataFnFake.getCall(0)).to.have.been.calledWith({ a: 1 });
    expect(onDataFnFake.getCall(1)).to.have.been.calledWith({ a: 2 });
    expect(onDataFnFake.getCall(2)).to.have.been.calledWith({ a: 3 });
    expect(onDataFnFake.getCall(3)).to.have.been.calledWith({ a: 4 });
    expect(onDataFnFake.getCall(4)).to.have.been.calledWith({ a: 5 });
    expect(onDataFnFake.getCall(5)).to.have.been.calledWith({ a: 6 });
    expect(onDataFnFake.getCall(6)).to.have.been.calledWith({ a: 7 });
    expect(onDataFnFake.getCall(7)).to.have.been.calledWith({ a: 8 });
    expect(onDataFnFake.getCall(8)).to.have.been.calledWith({ a: 9 });
    expect(onDataFnFake.getCall(9)).to.have.been.calledWith({ a: 10 });
    expect(onDataFnFake).to.have.callCount(10);
  });
  it("should call stream many with unsorted result if original streams are not sorted", async () => {
    const sortFn = (a, b) => {
      return a.a < b.a ? -1 : a.a > b.a ? 1 : 0;
    };

    const resultingUrl0 = "some-resulting-url0";
    const resultingUrl1 = "some-resulting-url1";

    const urlEncodeQueryDataFake = stub()
      .onCall(0)
      .returns(resultingUrl0)
      .onCall(1)
      .returns(resultingUrl1);

    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const requestFake = stub()
      .onCall(0)
      .returns(Readable.from([{ a: 5 }, { a: 2 }]))
      .onCall(1)
      .returns(Readable.from([{ a: 1 }, { a: 6 }]));

    replace(deps, "request", requestFake);
    const url0 = "http://google.com";
    const query0 = "some-query";
    const headers0 = "some-headers";
    const url1 = "http://gogle.com";
    const query1 = "some-other-query";
    const headers1 = "some-other-headers";
    const onDataFnFake = fake();
    const requests = [
      { url: url0, query: query0, headers: headers0 },
      { url: url1, query: query1, headers: headers1 },
    ];
    await request.streamMany(requests, onDataFnFake, sortFn);
    expect(requestFake.getCall(0)).to.have.been.calledWith({
      url: resultingUrl0,
      method: "GET",
      headers: headers0,
    });
    expect(requestFake.getCall(1)).to.have.been.calledWith({
      url: resultingUrl1,
      method: "GET",
      headers: headers1,
    });
    expect(requestFake).to.have.callCount(2);
    expect(onDataFnFake.getCall(0)).to.have.been.calledWith({ a: 1 });
    expect(onDataFnFake.getCall(1)).to.have.been.calledWith({ a: 5 });
    expect(onDataFnFake.getCall(2)).to.have.been.calledWith({ a: 2 });
    expect(onDataFnFake.getCall(3)).to.have.been.calledWith({ a: 6 });
    expect(onDataFnFake).to.have.callCount(4);
  });
});
