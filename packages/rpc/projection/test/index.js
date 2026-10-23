import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import projection from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const region = "some-region";

const envRegion = "some-env-region";

process.env.GCP_REGION = envRegion;

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
      region,
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
    expect(rpcFake).to.have.been.calledWith({
      region,
      operationNameComponents: [name, context, "projection"]
    });

    expect(postFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
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
    }).play({ root, domain, service });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith({
      region: envRegion,
      operationNameComponents: [name, "projection"]
    });
    expect(postFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });
});

describe("Projection token composition", () => {
  afterEach(restore);

  it("passes its token producer through the generic RPC boundary", async () => {
    const { default: rpc } = await import("../../generic/index.js");
    const { default: rpcDeps } = await import("../../generic/deps.js");
    replace(deps, "rpc", rpc);
    const post = fake.resolves({ statusCode: 204 });
    replace(rpcDeps, "post", post);
    const tokenFn = fake.resolves({ token: "fake-identity", type: "Bearer" });

    await projection({ name: "example" })
      .set({ token: { internalFn: tokenFn } })
      .play({ root: "root", domain: "domain", service: "service" });
    expect(tokenFn).to.have.been.calledOnce;
    expect(post.firstCall.args[1].headers).to.deep.equal({
      authorization: "Bearer fake-identity",
    });
  });
});
