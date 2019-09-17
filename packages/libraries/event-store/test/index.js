const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const eventStore = require("..");
const request = require("@sustainers/request");
const { useFakeTimers } = require("sinon");

const datetime = require("@sustainers/datetime");

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

const context = "some-context";

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
      context,
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
      "https://add.event-store.core.sustainer.network",
      {
        domain: commandDomain,
        service: commandService,
        event: {
          context,
          fact: {
            root,
            topic,
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
      context,
      fact: {
        root,
        topic,
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
      "https://add.event-store.core.sustainer.network",
      {
        domain: commandDomain,
        service: commandService,
        event: {
          context,
          fact: {
            root,
            topic,
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

  it("should call aggregate with the right params", async () => {
    const get = fake();
    replace(request, "get", get);

    const domain = "love!";
    const service = "some.domain";

    const root = "user";

    await eventStore.aggregate({ root, domain, service });

    expect(get).to.have.been.calledWith(
      "https://aggregate.event-store.core.sustainer.network",
      { domain, root, service }
    );
  });
});
