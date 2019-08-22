const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const eventStore = require("..");
const request = require("@sustainer-network/request");
const { useFakeTimers } = require("sinon");

const datetime = require("@sustainer-network/datetime");

let clock;

const now = new Date();

const domain = "love!";

const payload = {
  a: 1,
  b: 2
};

const root = "root";
const topic = "topic";
const version = "version";
const commandInstanceId = "commandId";
const commandAction = "command-action";
const commandDomain = "command-domain";
const commandService = "command-service";
const _service = "the-service-that-this-event-belongs-to";
const service = "the-service-the-event-was-triggered-in";

describe("Event store", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call add with the right params", async () => {
    const post = fake();
    replace(request, "post", post);

    const traceId = "traceId";
    const commandIssuedTimestamp = 234;

    await eventStore({ domain, service }).add({
      fact: {
        root,
        topic,
        service,
        version,
        traceId,
        commandAction,
        commandDomain,
        commandService,
        commandInstanceId,
        commandIssuedTimestamp
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        domain,
        service,
        event: {
          fact: {
            root,
            topic,
            service,
            version,
            commandInstanceId,
            commandAction,
            commandDomain,
            commandService,
            traceId,
            createdTimestamp: datetime.fineTimestamp(),
            commandIssuedTimestamp
          },
          payload
        }
      }
    );
  });

  it("should call add with the right params and optionals left out", async () => {
    const post = fake();
    replace(request, "post", post);

    await eventStore({ domain, service: _service }).add({
      fact: {
        root,
        topic,
        service,
        commandAction,
        commandDomain,
        commandService,
        commandInstanceId,
        version
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        domain,
        service: _service,
        event: {
          fact: {
            root,
            topic,
            service,
            version,
            commandAction,
            commandDomain,
            commandService,
            commandInstanceId,
            createdTimestamp: datetime.fineTimestamp()
          },
          payload
        }
      }
    );
  });

  it("should call hydrate with the right params", async () => {
    const get = fake();
    replace(request, "get", get);

    const domain = "love!";
    const service = "some.domain";

    const root = "user";

    await eventStore({ domain, service }).hydrate(root);

    expect(get).to.have.been.calledWith(
      "https://event-store.sustainer.network/hydrate",
      { domain, root, service }
    );
  });
});
