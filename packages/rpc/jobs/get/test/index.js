const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const deps = require("../deps");
const getJob = require("..");

let clock;

const now = new Date();

const name = "some-name!";
const domain = "some-domain!";
const service = "some-service";

const query = { a: 1 };
const tokenFn = "some-token-fn";

const context = { c: 2 };
const claims = "some-claims";

const envService = "some-env-service";

process.env.SERVICE = envService;

describe("Get job", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call read with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await getJob({ name, domain, service })
      .set({ context, claims, tokenFn })
      .read(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "get-job");
    expect(getFake).to.have.been.calledWith({
      query
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
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await getJob({ name, domain }).read(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "get-job"
    );
    expect(getFake).to.have.been.calledWith({
      query
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
  it("should call stream with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await getJob({ name, domain, service })
      .set({ context, claims, tokenFn })
      .stream(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "get-job");
    expect(getFake).to.have.been.calledWith({
      query
    });
    expect(inFake).to.have.been.calledWith({
      context
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      tokenFn,
      claims
    });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await getJob({ name, domain }).stream(query);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      envService,
      "get-job"
    );
    expect(getFake).to.have.been.calledWith({
      query
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({ path: "/stream" });
  });
});
