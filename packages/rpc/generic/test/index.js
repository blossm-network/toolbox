const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const operation = require("..");

const deps = require("../deps");

let clock;

const now = new Date();

const data = { a: 1, context: 3 };
const context = { b: 4 };
const claims = "some-claims";
const operarationPart1 = "some-operaration1";
const operarationPart2 = "some-operaration2";
const token = "some-token";
const type = "some-type";
const id = "some-id";
const tokenFn = "some-token-fn";
const url = "some-url";

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
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
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
        Authorization: `${type} ${token}`,
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
      .with({ path, internalTokenFn: tokenFn, claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .with({ internalTokenFn: tokenFn, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .with({ internalTokenFn: tokenFn, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .with({ internalTokenFn: tokenFn, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .with({ internalTokenFn: tokenFn, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .with({ path, internalTokenFn: tokenFn, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
      .delete(id)
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, claims });

    expect(del).to.have.been.calledWith(url, {
      body: {
        context,
        claims,
      },
      headers: {
        Authorization: `${type} ${token}`,
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
    const errBody = { message: errorMessage };
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

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(id)
        .in({ context, host })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: errorMessage,
      });
      expect(e).to.equal(error);
    }
  });
  it("should return error correctly without message", async () => {
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

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(id)
        .in({ context, host })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: "Not specified",
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
        .delete(id)
        .in({ context, host })
        .with({ tokenFn, claims });

      //shouldnt be called
      expect(3).to.equal(4);
    } catch (e) {
      expect(e).to.exist;
    }
  });
});
