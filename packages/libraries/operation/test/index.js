const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const operation = require("..");
const request = require("@sustainers/request");

let clock;

const now = new Date();

const data = { a: 1, context: 3 };
const context = { b: 4 };
const op = "some.operation";
const token = "some-token";
const root = "some-root";

const network = "some-network";
const service = "some-service";

describe("Operation", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call post with the correct params", async () => {
    const post = fake();
    replace(request, "post", post);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .post(data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(post).to.have.been.calledWith(
      `http://${op}.${service}.${network}`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });

  it("should call post with the correct params with no token", async () => {
    const post = fake();
    replace(request, "post", post);

    const emptyTokenFake = fake();
    await operation(op)
      .post(data)
      .in({ context, service, network })
      .with({ tokenFn: emptyTokenFake });

    expect(post).to.have.been.calledWith(`http://${op}.${service}.${network}`, {
      ...data,
      context
    });
    expect(emptyTokenFake).to.have.been.calledWith({
      operation: op
    });
  });

  it("should call post with the correct params with path", async () => {
    const post = fake();
    replace(request, "post", post);

    const tokenFnFake = fake.returns(token);
    const path = "/some/path";
    await operation(op)
      .post(data)
      .in({ context, service, network })
      .with({ path, tokenFn: tokenFnFake });

    expect(post).to.have.been.calledWith(
      `http://${op}.${service}.${network}${path}:3001`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });

  it("should call get with the correct params", async () => {
    const get = fake();
    replace(request, "get", get);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .get(data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(get).to.have.been.calledWith(
      `http://${op}.${service}.${network}`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });
  it("should call put with the correct params", async () => {
    const put = fake();
    replace(request, "put", put);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .put(root, data)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(put).to.have.been.calledWith(
      `http://${op}.${service}.${network}/${root}`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });
  it("should call put with the correct params with path", async () => {
    const put = fake();
    replace(request, "put", put);

    const tokenFnFake = fake.returns(token);
    const path = "/some/path";
    await operation(op)
      .put(root, data)
      .in({ context, service, network })
      .with({ path, tokenFn: tokenFnFake });

    expect(put).to.have.been.calledWith(
      `http://${op}.${service}.${network}${path}:3001/${root}`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });
  it("should call delete with the correct params", async () => {
    const del = fake();
    replace(request, "delete", del);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .delete(root)
      .in({ context, service, network })
      .with({ tokenFn: tokenFnFake });

    expect(del).to.have.been.calledWith(
      `http://${op}.${service}.${network}/${root}`,
      {
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });
});
