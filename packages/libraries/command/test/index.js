const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const datetime = require("@sustainers/datetime");

const deps = require("../deps");
const command = require("..");

let clock;

const now = new Date();

const action = "some-action!";
const domain = "some-domain!";
const service = "some-service";
const network = "some-network";

const payload = { a: 1 };
const trace = "some-trace";
const source = "some-source";
const tokenFn = "some-token-fn";

const context = { c: 2 };

describe("Issue command", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    await command({ action, domain, service, network })
      .issue(payload, { trace, source })
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(`${action}.${domain}`);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: datetime.fineTimestamp(),
        trace,
        source
      }
    });
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });
  it("should call with the correct optional params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    await command({ action, domain, service, network })
      .issue(payload)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(`${action}.${domain}`);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: datetime.fineTimestamp()
      }
    });
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });
});
