const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const projection = require("..");

const name = "some-name";
const domain = "some-domain";
const service = "some-service";

const internalTokenFn = "some-internal-token-fn";

const root = "some-root";

describe("Replay projection", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);
    const enqueueFnResult = "some-enqueue-fn-result";
    const enqueueFnFake = fake.returns(enqueueFnResult);
    const enqueueWait = "some-enqueue-wait";

    const { body: result } = await projection({
      name,
      context,
    })
      .set({
        token: { internalFn: internalTokenFn },
        enqueue: {
          fn: enqueueFnFake,
          wait: enqueueWait,
        },
      })
      .play({ root, domain, service });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, context, "projection");

    expect(postFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      internalFn: internalTokenFn,
      enqueueFn: enqueueFnResult,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      queue: `projection-${context}-${name}-play`,
      wait: enqueueWait,
    });
  });
  it("should call with the correct params with optionals omitted", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const { body: result } = await projection({
      name,
      context,
    }).play({ root, domain, service });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, context, "projection");
    expect(postFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });
});
