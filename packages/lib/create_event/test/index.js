const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const createEvent = require("../");
const datetime = require("@sustainer-network/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

describe("Create event", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should get called with expected params", async () => {
    const traceId = "tradeId!";
    const commandInstanceId = "commandInstanceId!";
    const name = "command!";
    const issuedTimestamp = 23;
    const root = "root!";
    const topic = "topic!";
    const service = "sustainer-network";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      commandInstanceId,
      name,
      issuedTimestamp
    };

    const value = await createEvent(body, {
      root,
      topic,
      service,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root,
        topic,
        service,
        version,
        traceId,
        commandInstanceId,
        command: name,
        commandIssuedTimestamp: issuedTimestamp,
        createdTimestamp: datetime.fineTimestamp()
      },
      payload
    });
  });
  it("should get called with expected params if root is missin", async () => {
    const newUuid = "newUuid!";
    replace(deps, "makeUuid", fake.returns(newUuid));

    const traceId = "tradeId!";
    const commandInstanceId = "commandInstanceId!";
    const name = "command!";
    const issuedTimestamp = 23;
    const topic = "topic!";
    const service = "sustainer.network";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      commandInstanceId,
      name,
      issuedTimestamp
    };

    const value = await createEvent(body, {
      topic,
      service,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root: newUuid,
        topic,
        service,
        version,
        traceId,
        commandInstanceId,
        command: name,
        commandIssuedTimestamp: issuedTimestamp,
        createdTimestamp: datetime.fineTimestamp()
      },
      payload
    });
  });
});
