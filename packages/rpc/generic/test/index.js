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
const procedurePart1 = "some-procedure1";
const procedurePart2 = "some-procedure2";
const token = "some-token";
const root = "some-root";
const tokenFn = "some-token-fn";
const url = "some-url";

const network = "some-network";
const service = "some-service";
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
const envService = "some-env-service";
process.env.NETWORK = envNetwork;
process.env.SERVICE = envService;

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

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .post(data)
      .in({ context, service, network })
      .with({ tokenFn });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network
    });
    expect(result).to.be.null;
  });
  it("should call post with the correct params with env network and servicej", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .post(data)
      .in({ context })
      .with({ tokenFn });

    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service: envService,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service: envService,
      network: envNetwork
    });
    expect(result).to.be.null;
  });
  it("should call post with the correct params with no token", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const serviceTokenFake = fake.returns(null);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .post(data)
      .in({ context, service, network })
      .with();

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      }
    });
    expect(result).to.be.null;
  });

  it("should call post with the correct params with path", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const path = "/some/path";
    const result = await operation(procedurePart1, procedurePart2)
      .post(data)
      .in({ context, service, network })
      .with({ path, tokenFn });

    expect(post).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network,
      path
    });
    expect(result).to.be.null;
  });

  it("should call get with the correct params", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .get(data)
      .in({ context, service, network })
      .with({ tokenFn });

    expect(get).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network
    });
    expect(result).to.deep.equal(body);
  });
  it("should call get with the correct params with root", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .get({ ...data, root })
      .in({ context, service, network })
      .with({ tokenFn });

    expect(get).to.have.been.calledWith(url, {
      query: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network,
      root
    });
    expect(result).to.deep.equal(body);
  });
  it("should call put with the correct params", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .put(root, data)
      .in({ context, service, network })
      .with({ tokenFn });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network,
      root
    });
    expect(result).to.be.null;
  });
  it("should call put with the correct params with path", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const path = "/some/path";
    const result = await operation(procedurePart1, procedurePart2)
      .put(root, data)
      .in({ context, service, network })
      .with({ path, tokenFn });

    expect(put).to.have.been.calledWith(url, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
      network,
      root,
      path
    });
    expect(result).to.be.null;
  });
  it("should call delete with the correct params", async () => {
    const del = fake.returns(response);
    replace(deps, "delete", del);

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const result = await operation(procedurePart1, procedurePart2)
      .delete(root)
      .in({ context, service, network })
      .with({ tokenFn });

    expect(del).to.have.been.calledWith(url, {
      body: {
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(serviceTokenFake).to.have.been.calledWith({
      tokenFn,
      service,
      procedure: [procedurePart1, procedurePart2]
    });
    expect(serviceUrlFake).to.have.been.calledWith({
      procedure: [procedurePart1, procedurePart2],
      service,
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

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(procedurePart1, procedurePart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn });

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

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(procedurePart1, procedurePart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn });

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

    const serviceTokenFake = fake.returns(token);
    replace(deps, "serviceToken", serviceTokenFake);

    const serviceUrlFake = fake.returns(url);
    replace(deps, "serviceUrl", serviceUrlFake);

    try {
      await operation(procedurePart1, procedurePart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn });

      //shouldnt be called
      expect(3).to.equal(4);
    } catch (e) {
      expect(e).to.exist;
    }
  });
});
