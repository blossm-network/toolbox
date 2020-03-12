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
const root = "some-root";
const tokenFn = "some-token-fn";
const url = "some-url";

const network = "some-network";
const statusCode = 204;
const response = {
  statusCode
};
const body = {
  some: "body"
};
const bodyResponse = {
  body: JSON.stringify(body),
  statusCode: 200
};

const envNetwork = "some-env-network";
process.env.NETWORK = envNetwork;

describe("Operation", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call post with the correct params", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, network })
      .with({ tokenFn, claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network
    });
    expect(result).to.be.null;
  });
  it("should call post with the correct params without context or claims", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ network })
      .with({ tokenFn });

    expect(post).to.have.been.calledWith(url, {
      body: data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],

      network
    });
    expect(result).to.be.null;
  });
  it("should call post with the correct params with env network and service", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context })
      .with({ tokenFn, claims });

    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network: envNetwork
    });
    expect(result).to.be.null;
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
      .in({ context, network })
      .with({ claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims
      }
    });
    expect(result).to.be.null;
  });

  it("should call post with the correct params with path", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const path = "/some/path";
    const result = await operation(operarationPart1, operarationPart2)
      .post(data)
      .in({ context, network })
      .with({ path, tokenFn, claims });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network,
      path
    });
    expect(result).to.be.null;
  });

  it("should call get with the correct params", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .get(data)
      .in({ context, network })
      .with({ tokenFn, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network
    });
    expect(result).to.deep.equal(body);
  });
  it("should call get with the correct params with root", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .get({ ...data, root })
      .in({ context, network })
      .with({ tokenFn, claims });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network,
      root
    });
    expect(result).to.deep.equal(body);
  });
  it("should call put with the correct params", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .put(root, data)
      .in({ context, network })
      .with({ tokenFn, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network,
      root
    });
    expect(result).to.be.null;
  });
  it("should call put with the correct params with path", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const path = "/some/path";
    const result = await operation(operarationPart1, operarationPart2)
      .put(root, data)
      .in({ context, network })
      .with({ path, tokenFn, claims });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network,
      root,
      path
    });
    expect(result).to.be.null;
  });
  it("should call delete with the correct params", async () => {
    const del = fake.returns(response);
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const result = await operation(operarationPart1, operarationPart2)
      .delete(root)
      .in({ context, network })
      .with({ tokenFn, claims });

    expect(del).to.have.been.calledWith(url, {
      body: {
        context,
        claims
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2]
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      network,
      root
    });
    expect(result).to.be.null;
  });
  it("should return error correctly", async () => {
    const errorStatusCode = 400;
    const statusMessage = "some-status-message";
    const errorMessage = "some-error-message";
    const errBody = { message: errorMessage };
    const del = fake.returns({
      statusCode: errorStatusCode,
      statusMessage,
      body: JSON.stringify(errBody)
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(root)
        .in({ context, network })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: errorMessage
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
      body: JSON.stringify(errBody)
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(root)
        .in({ context, network })
        .with({ tokenFn, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: "Not specified"
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
      body: JSON.stringify(errBody)
    });
    replace(deps, "delete", del);

    const operationTokenFake = fake.returns(token);
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    try {
      await operation(operarationPart1, operarationPart2)
        .delete(root)
        .in({ context, network })
        .with({ tokenFn, claims });

      //shouldnt be called
      expect(3).to.equal(4);
    } catch (e) {
      expect(e).to.exist;
    }
  });
});
