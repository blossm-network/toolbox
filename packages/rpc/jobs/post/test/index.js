const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const deps = require("../deps");
const postJob = require("..");

let clock;

const now = new Date();

const name = "some-name!";
const domain = "some-domain!";
const service = "some-service";

const payload = { a: 1 };
const tokenFn = "some-token-fn";

const context = { c: 2 };
const claims = "some-claims";

const envService = "some-env-service";

process.env.SERVICE = envService;

describe("Post job", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await postJob({ name, domain, service })
      .set({ context, claims, tokenFn })
      .trigger(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "post-job");
    expect(postFake).to.have.been.calledWith({
      payload
    });
    expect(inFake).to.have.been.calledWith({
      context
    });
    expect(withFake).to.have.been.calledWith({ tokenFn, claims });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await postJob({ name, domain }).trigger(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "post-job"
    );
    expect(postFake).to.have.been.calledWith({
      payload
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
});
