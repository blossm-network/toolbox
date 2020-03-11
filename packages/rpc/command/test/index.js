const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const { string: dateString } = require("@blossm/datetime");

const deps = require("../deps");
const command = require("..");

let clock;

const now = new Date();

const name = "some-nmae!";
const domain = "some-domain!";
const service = "some-service";
const network = "some-network";

const payload = { a: 1 };
const options = "some-options";
const trace = "some-trace";
const source = "some-source";
const tokenFn = "some-token-fn";
const issued = "some-issued";
const id = "some-id";

const context = { c: 2 };
const claims = "some-claims";

const root = "some-root";

describe("Issue command", () => {
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

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

    const result = await command({ name, domain, service, network })
      .set({ context, claims, tokenFn })
      .issue(payload, { trace, source, issued, root, options });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, "command-handler");
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued,
        trace,
        source,
        id
      },
      root,
      options
    });
    expect(inFake).to.have.been.calledWith({
      context,
      service,
      network
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

    const uuidFake = fake.returns(id);
    replace(deps, "uuid", uuidFake);

    const result = await command({ name, domain }).issue(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: dateString(),
        id
      }
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
});
