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
const opPart1 = "oppartone";
const opPart2 = "opparttwo";
const token = "some-token";
const root = "some-root";
const hash = "some-hash";
const trimmed = "some-trimmed";
const MAX_LENGTH = 25;

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

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const result = await operation(opPart1, opPart2)
      .post(data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(post).to.have.been.calledWith(`http://${hash}.${network}`, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.be.null;
  });
  it("should call post with the correct params with no token", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const result = await operation(opPart1, opPart2)
      .post(data)
      .in({ context, service, network })
      .with();

    expect(post).to.have.been.calledWith(`http://${hash}.${network}`, {
      body: {
        ...data,
        context
      }
    });
    expect(trimFake).to.have.not.been.called;
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(result).to.be.null;
  });

  it("should call post with the correct params with no token", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const emptyTokenFake = fake();

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const result = await operation(opPart1, opPart2)
      .post(data)
      .in({ context, service, network })
      .with({ tokenFn: emptyTokenFake });

    expect(post).to.have.been.calledWith(`http://${hash}.${network}`, {
      body: {
        ...data,
        context
      }
    });
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(emptyTokenFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.be.null;
  });

  it("should call post with the correct params with path", async () => {
    const post = fake.returns(response);
    replace(deps, "post", post);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const path = "/some/path";
    const result = await operation(opPart1, opPart2)
      .post(data)
      .in({ context, service, network })
      .with({ path, tokenFn: tokenFnFake });

    expect(post).to.have.been.calledWith(`http://${hash}.${network}${path}`, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.be.null;
  });

  it("should call get with the correct params", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const result = await operation(opPart1, opPart2)
      .get(data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(get).to.have.been.calledWith(`http://${hash}.${network}`, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.deep.equal(body);
  });
  it("should call get with the correct params with root", async () => {
    const get = fake.returns(bodyResponse);
    replace(deps, "get", get);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const result = await operation(opPart1, opPart2)
      .get({ ...data, root })
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(get).to.have.been.calledWith(`http://${hash}.${network}/${root}`, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.deep.equal(body);
  });
  it("should call put with the correct params", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const result = await operation(opPart1, opPart2)
      .put(root, data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(put).to.have.been.calledWith(`http://${hash}.${network}/${root}`, {
      body: {
        ...data,
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.be.null;
  });
  it("should call put with the correct params with path", async () => {
    const put = fake.returns(response);
    replace(deps, "put", put);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const path = "/some/path";
    const result = await operation(opPart1, opPart2)
      .put(root, data)
      .in({ context, service, network })
      .with({ path, tokenFn: tokenFnFake });

    expect(put).to.have.been.calledWith(
      `http://${hash}.${network}${path}/${root}`,
      {
        body: {
          ...data,
          context
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
    });
    expect(result).to.be.null;
  });
  it("should call delete with the correct params", async () => {
    const del = fake.returns(response);
    replace(deps, "delete", del);

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);
    const result = await operation(opPart1, opPart2)
      .delete(root)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(del).to.have.been.calledWith(`http://${hash}.${network}/${root}`, {
      body: {
        context
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    expect(trimFake).to.have.been.calledWith(
      `${service}-${opPart2}-${opPart1}`,
      MAX_LENGTH
    );
    expect(hashFake).to.have.been.calledWith(opPart1 + opPart2 + service);
    expect(tokenFnFake).to.have.been.calledWith({
      hash,
      name: trimmed
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

    const toStringFake = fake.returns(hash);
    const hashFake = fake.returns({
      toString: toStringFake
    });
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(opPart1, opPart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn: tokenFnFake });

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

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);

    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await operation(opPart1, opPart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn: tokenFnFake });

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

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);

    try {
      await operation(opPart1, opPart2)
        .delete(root)
        .in({ context, service, network })
        .with({ tokenFn: tokenFnFake });

      //shouldnt be called
      expect(3).to.equal(4);
    } catch (e) {
      expect(e).to.exist;
    }
  });
});
