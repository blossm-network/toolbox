const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const { string: dateString } = require("@sustainers/datetime");

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
    const response = "some-response";
    const withFake = fake.returns(response);
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

    const result = await command({ action, domain, service, network })
      .set({ context, tokenFn })
      .issue(payload, { trace, source });

    expect(result).to.equal(response);
    expect(operationFake).to.have.been.calledWith(
      action,
      domain,
      "command-handler"
    );
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: dateString(),
        trace,
        source
      }
    });
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
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
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    const result = await command({ action, domain, service, network }).issue(
      payload
    );

    expect(result).to.equal(response);
    expect(operationFake).to.have.been.calledWith(action, domain);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: dateString()
      }
    });
    expect(inFake).to.have.been.calledWith({ service, network });
    expect(withFake).to.have.been.calledWith();
  });
});
