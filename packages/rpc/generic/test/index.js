const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake, match } = require("sinon");
const operation = require("..");

const deps = require("../deps");

const data = { a: 1, context: 3 };
const context = { b: 4 };
const claims = "some-claims";
const operarationPart1 = "some-operaration1";
const operarationPart2 = "some-operaration2";
const token = "some-token";
const type = "some-type";
const id = "some-id";
const tokenFn = "some-token-fn";
const currentToken = "some-current-token";
const url = "some-url";
const query = "some-query";

const host = "some-host";
const statusCode = 204;
const response = {
  statusCode,
};
const body = {
  some: "body",
};

const bodyStatusCode = 200;
const bodyResponse = {
  body: JSON.stringify(body),
  statusCode: bodyStatusCode,
};

describe("Operation", () => {
  beforeEach(() => {
    process.env.HOST = host;
    process.env.NODE_ENV = "not-local";
  });
  afterEach(() => {
    restore();
  });

  it("should call post with the correct params", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call post with the correct params with enqueueFn", async () => {
    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const enqueueOperationFake = fake.returns(response);
    replace(deps, "enqueueOperation", enqueueOperationFake);

    const enqueueFn = "some-enqueue-fn";
    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims, enqueueFn });

    expect(enqueueOperationFake).to.have.been.calledWith({
      enqueueFn,
      url,
      data: {
        ...data,
        context,
        claims,
      },
      operation: [operarationPart1, operarationPart2],
      method: "post",
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call put with the correct params with enqueueFn", async () => {
    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const enqueueOperationFake = fake.returns(response);
    replace(deps, "enqueueOperation", enqueueOperationFake);

    const enqueueFn = "some-enqueue-fn";
    await operation(operarationPart1, operarationPart2)
      .put(id, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims, enqueueFn });

    expect(enqueueOperationFake).to.have.been.calledWith({
      enqueueFn,
      url,
      data: {
        ...data,
        context,
        claims,
      },
      operation: [operarationPart1, operarationPart2],
      method: "put",
    });
  });
  it("should call delete with the correct params with enqueueFn", async () => {
    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const enqueueOperationFake = fake.returns(response);
    replace(deps, "enqueueOperation", enqueueOperationFake);

    const enqueueFn = "some-enqueue-fn";
    await operation(operarationPart1, operarationPart2)
      .delete(id, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims, enqueueFn });

    expect(enqueueOperationFake).to.have.been.calledWith({
      enqueueFn,
      url,
      data: {
        ...data,
        context,
        claims,
      },
      operation: [operarationPart1, operarationPart2],
      method: "delete",
    });
  });
  it("should call post with the correct params with enqueueFn in local env", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const enqueueOperationFake = fake.returns(response);
    replace(deps, "enqueueOperation", enqueueOperationFake);

    const enqueueFn = "some-enqueue-fn";
    process.env.NODE_ENV = "local";
    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims, enqueueFn });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(enqueueOperationFake).to.not.have.been.called;
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({});
  });

  it("should call post with the correct params with env host and service", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const envHost = "some-env-host";
    process.env.HOST = envHost;

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context })
      .with({ internalTokenFn: tokenFn, claims });

    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host: envHost,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call post with the correct params with other host", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const networkTokenFake = fake.returns({ token, type });
    replace(deps, "networkToken", networkTokenFake);

    const networkUrlFake = fake.returns(url);
    replace(deps, "networkUrl", networkUrlFake);

    const otherHost = "some-other-host";
    const otherNetwork = "some-other-network";

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, network: otherNetwork, host: otherHost })
      .with({ externalTokenFn: tokenFn, claims });

    expect(post).to.have.been.calledWith(url, {
      body: data,
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(networkTokenFake).to.have.been.calledWith({
      tokenFn,
      network: otherNetwork,
    });
    expect(networkUrlFake).to.have.been.calledWith({
      host: otherHost,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call post with the correct params with no token", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns(null);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, host })
      .with({ claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
    });
    expect(result).to.deep.equal({ statusCode });
  });

  it("should call post with the correct params with path", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const path = "/some/path";
    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, host })
      .with({ path, internalTokenFn: tokenFn, currentToken, claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      path,
    });
    expect(result).to.deep.equal({ statusCode });
  });

  it("should call get with the correct params", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .get(data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({ statusCode: bodyStatusCode, body });
  });
  it("should call get with queueFn ignored", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const enqueueFnFake = fake.returns("whatever");
    const result = await operation(operarationPart1, operarationPart2)
      .get(data)
      .in({ context, host })
      .with({
        internalTokenFn: tokenFn,
        claims,
        currentToken,
        enqueueFn: enqueueFnFake,
      });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({ statusCode: bodyStatusCode, body });
  });
  it("should call get with the correct params with non json response", async () => {
    const response = "some-response";
    const get = fake.returns({
      body: response,
      statusCode: bodyStatusCode,
    });
    replace(deps, "get", get);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .get(data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.deep.equal({
      statusCode: bodyStatusCode,
      body: response,
    });
  });
  it("should call get with the correct params with id", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .get({ ...data, id })
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(result).to.deep.equal({
      statusCode: bodyStatusCode,
      body,
    });
  });
  it("should call stream with the correct params", async () => {
    const streamFake = fake();
    replace(deps, "stream", streamFake);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const result = await operation(operarationPart1, operarationPart2)
      .stream(fnFake, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(streamFake).to.have.been.calledWith(
      url,
      match((func) => {
        const obj = { a: 1 };
        const stringObj = JSON.stringify(obj);
        const buffer = Buffer.from(stringObj);
        func(buffer);
        return fnFake.calledWith({ a: 1 });
      }),
      {
        query: {
          ...data,
          context,
          claims,
          token: currentToken,
        },
        headers: {
          authorization: `${type} ${token}`,
        },
      }
    );
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.equal();
  });
  it("should call stream with the correct params with multiple parsedData", async () => {
    const streamFake = fake();
    replace(deps, "stream", streamFake);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const result = await operation(operarationPart1, operarationPart2)
      .stream(fnFake, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(streamFake).to.have.been.calledWith(
      url,
      match((func) => {
        const response = func("some-data");
        return Promise.resolve(response) == response;
      }),
      {
        query: {
          ...data,
          context,
          claims,
          token: currentToken,
        },
        headers: {
          authorization: `${type} ${token}`,
        },
      }
    );
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
    });
    expect(result).to.equal();

    const obj = { a: 1, b: { c: 3 } };
    const obj1 = { k: 1, b: { c: 3 } };
    const obj2 = { p: 1, b: { c: 3 } };
    const stringObj = JSON.stringify(obj);
    const stringObj1 = JSON.stringify(obj1);
    const stringObj2 = JSON.stringify(obj2);
    const leftover = '{ "q": 3';
    const buffer = Buffer.from(stringObj + stringObj1 + stringObj2 + leftover);
    await streamFake.lastCall.args[1](buffer);
    await streamFake.lastCall.args[1](Buffer.from('}{ "w": 4'));
    await streamFake.lastCall.args[1](Buffer.from("}"));
    expect(fnFake.getCall(0)).to.have.been.calledWith({ a: 1, b: { c: 3 } });
    expect(fnFake.getCall(1)).calledWith({ k: 1, b: { c: 3 } });
    expect(fnFake.getCall(2)).calledWith({ p: 1, b: { c: 3 } });
    expect(fnFake.getCall(3)).calledWith({ q: 3 });
    expect(fnFake.getCall(4)).calledWith({ w: 4 });
  });
  it("should call stream with the correct params with id", async () => {
    const streamFake = fake();
    replace(deps, "stream", streamFake);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const result = await operation(operarationPart1, operarationPart2)
      .stream(fnFake, { ...data, id })
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(streamFake).to.have.been.calledWith(
      url,
      match((func) => {
        const obj = { a: 1 };
        const stringObj = JSON.stringify(obj);
        const buffer = Buffer.from(stringObj);
        func(buffer);
        return fnFake.calledWith(obj);
      }),
      {
        query: {
          ...data,
          context,
          claims,
          token: currentToken,
        },
        headers: {
          authorization: `${type} ${token}`,
        },
      }
    );
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(result).to.equal();
  });
  it("should call put with the correct params", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .put(id, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });

    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call put with the correct params with path", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const path = "/some/path";
    const result = await operation(operarationPart1, operarationPart2)
      .put(id, data)
      .in({ context, host })
      .with({ path, internalTokenFn: tokenFn, currentToken, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
        token: currentToken,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
      path,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should call delete with the correct params", async () => {
    const del = fake.returns(response);
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .delete(id, data)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(del).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        token: currentToken,
        claims,
      },
      headers: {
        authorization: `${type} ${token}`,
      },
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(result).to.deep.equal({ statusCode });
  });
  it("should return error correctly", async () => {
    const errorStatusCode = 400;
    const statusMessage = "some-status-message";
    const errorMessage = "some-error-message";
    const info = { some: "info" };
    const code = "some-code";
    const errBody = { message: errorMessage, info, code };
    const del = fake.returns({
      statusCode: errorStatusCode,
      statusMessage,
      body: JSON.stringify(errBody),
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    const network = "some-network";
    try {
      await operation(operarationPart1, operarationPart2)
        .delete(id)
        .in({ context, host, network })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: errorMessage,
        code,
        info: {
          ...info,
          context: { b: 4 },
          data: {
            claims: "some-claims",
            context: { b: 4 },
          },
          network,
          token: "some-token",
          url: "some-url",
        },
      });
      expect(e).to.equal(error);
    }
  });
  it("should return error correctly without message, info, or code", async () => {
    const errorStatusCode = 400;
    const statusMessage = "some-status-message";
    const errBody = { some: "err" };
    const del = fake.returns({
      statusCode: errorStatusCode,
      statusMessage,
      body: JSON.stringify(errBody),
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    const network = "some-network";
    try {
      await operation(operarationPart1, operarationPart2)
        .delete(id)
        .in({ context, host, network })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: "Not specified",
        info: {
          context: { b: 4 },
          data: { claims: "some-claims", context },
          network,
          token: "some-token",
          url: "some-url",
        },
      });
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly", async () => {
    const errorStatusCode = 400;
    const statusMessage = "some-status-message";
    const errBody = { some: "err" };
    const del = fake.rejects({
      statusCode: errorStatusCode,
      statusMessage,
      body: JSON.stringify(errBody),
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(query)
        .in({ context, host })
        .with({ tokenFn, claims });

      //shouldnt be called
      expect(3).to.equal(4);
    } catch (e) {
      expect(e).to.exist;
    }
  });
});
