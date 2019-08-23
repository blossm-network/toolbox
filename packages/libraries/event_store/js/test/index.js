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

const payload = {
  a: 1,
  b: 2
};

const root = "root";
const topic = "topic";
const version = "version";
const commandId = "commandId";
const commandAction = "command-action";
const commandDomain = "command-domain";
const commandService = "command-service";
const commandIssuedTimestamp = 234;
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

    await eventStore.add({
      fact: {
        root,
        topic,
        service,
        version,
        traceId,
        command: {
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          id: commandId,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        domain: commandDomain,
        service: commandService,
        event: {
          fact: {
            root,
            topic,
            service,
            version,
            command: {
              id: commandId,
              action: commandAction,
              domain: commandDomain,
              service: commandService,
              issuedTimestamp: commandIssuedTimestamp
            },
            traceId,
            createdTimestamp: datetime.fineTimestamp()
          },
          payload
        }
      }
    );
  });

  it("should call add with the right params and optionals left out", async () => {
    const post = fake();
    replace(request, "post", post);

    await eventStore.add({
      fact: {
        root,
        topic,
        service,
        command: {
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          id: commandId,
          issuedTimestamp: commandIssuedTimestamp
        },
        version
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        domain: commandDomain,
        service: commandService,
        event: {
          fact: {
            root,
            topic,
            service,
            version,
            command: {
              action: commandAction,
              domain: commandDomain,
              service: commandService,
              id: commandId,
              issuedTimestamp: commandIssuedTimestamp
            },
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

    await eventStore.hydrate({ root, domain, service });

    expect(get).to.have.been.calledWith(
      "https://event-store.sustainer.network/hydrate",
      { domain, root, service }
    );
  });
});
