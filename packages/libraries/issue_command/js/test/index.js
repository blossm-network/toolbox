const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const datetime = require("@sustainers/datetime");

const deps = require("../deps");
const issueCommand = require("..");

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
    const on = fake();
    const post = fake.returns({
      on
    });
    const operation = fake.returns({
      post
    });
    replace(deps, "operation", operation);

    await issueCommand({ action, domain, service, network })
      .with({ payload, trace, source, tokenFn })
      .in(context);

    expect(operation).to.have.been.calledWith(`${action}.${domain}`);
    expect(post).to.have.been.calledWith({
      data: {
        payload,
        headers: {
          issued: datetime.fineTimestamp(),
          trace,
          source
        }
      },
      context,
      tokenFn
    });
    expect(on).to.have.been.calledWith({ service, network });
  });
  it("should call with the correct optional params", async () => {
    const on = fake();
    const post = fake.returns({
      on
    });
    const operation = fake.returns({
      post
    });
    replace(deps, "operation", operation);

    await issueCommand({ action, domain, service, network })
      .with({ payload, tokenFn })
      .in(context);

    expect(operation).to.have.been.calledWith(`${action}.${domain}`);
    expect(post).to.have.been.calledWith({
      data: {
        payload,
        headers: {
          issued: datetime.fineTimestamp()
        }
      },
      context,
      tokenFn
    });
    expect(on).to.have.been.calledWith({ service, network });
  });
});
