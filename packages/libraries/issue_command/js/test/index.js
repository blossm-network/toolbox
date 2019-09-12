const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const datetime = require("@sustainers/datetime");
const request = require("@sustainers/request");

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

const context = { c: 2 };

describe("Issue command", () => {
  beforeEach(() => {
    (process.env.SERVICE = service), (process.env.NETWORK = network);
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const post = fake();
    replace(request, "post", post);

    await issueCommand({ action, domain })
      .with(payload, { trace, source })
      .in(context);

    expect(post).to.have.been.calledWith(
      `https://${service}.command.${network}/${action}.${domain}`,
      {
        payload,
        header: {
          issued: datetime.fineTimestamp(),
          trace,
          source
        },
        context
      }
    );
  });
  it("should call with the correct optional params", async () => {
    const post = fake();
    replace(request, "post", post);

    await issueCommand({ action, domain })
      .with(payload)
      .in(context);

    expect(post).to.have.been.calledWith(
      `https://${service}.command.${network}/${action}.${domain}`,
      {
        payload,
        header: {
          issued: datetime.fineTimestamp()
        },
        context
      }
    );
  });
});
