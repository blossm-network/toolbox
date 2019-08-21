const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const eventStore = require("../index");
const request = require("@sustainer-network/request");
const { useFakeTimers } = require("sinon");

const datetime = require("@sustainer-network/datetime");

let clock;

const now = new Date();

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

    const store = "love!";

    const payload = {
      a: 1,
      b: 2
    };

    const root = "root";
    const topic = "topic";
    const version = "version";
    const traceId = "traceId";
    const command = "command";
    const commandInstanceId = "commandId";
    const commandIssuedTimestamp = 234;
    const service = "some-domain";

    await eventStore({ store, service }).add({
      fact: {
        root,
        topic,
        version,
        traceId,
        command,
        commandInstanceId,
        commandIssuedTimestamp
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        store,
        service,
        event: {
          fact: {
            root,
            topic,
            version,
            commandInstanceId,
            command,
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

    const store = "love!";

    const payload = {
      a: 1,
      b: 2
    };

    const root = "root";
    const topic = "topic";
    const version = "version";
    const commandInstanceId = "commandId";
    const command = "command";
    const service = "some-domain";

    await eventStore({ store, service }).add({
      fact: {
        root,
        topic,
        command,
        commandInstanceId,
        version
      },
      payload
    });

    expect(post).to.have.been.calledWith(
      "https://event-store.sustainer.network/add",
      {
        store,
        service,
        event: {
          fact: {
            root,
            topic,
            version,
            command,
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

    const store = "love!";
    const service = "some.domain";

    const root = "user";

    await eventStore({ store, service }).hydrate(root);

    expect(get).to.have.been.calledWith(
      "https://event-store.sustainer.network/hydrate",
      { store, root, service }
    );
  });
});
