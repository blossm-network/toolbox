const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const createEvent = require("../");
const deps = require("../deps");

describe("Create event", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
    const traceId = "tradeId!";
    const commandInstanceId = "commandInstanceId!";
    const name = "command!";
    const issuedTimestamp = 23;
    const root = "root!";
    const topic = "topic!";
    const serviceDomain = "sustainer.network";
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
      serviceDomain,
      payload,
      version
    });

    expect(value).to.deep.equal({
      root,
      topic,
      serviceDomain,
      payload,
      version,
      traceId,
      commandInstanceId,
      command: name,
      commandIssuedTimestamp: issuedTimestamp
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
    const serviceDomain = "sustainer.network";
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
      serviceDomain,
      payload,
      version
    });

    expect(value).to.deep.equal({
      root: newUuid,
      topic,
      serviceDomain,
      payload,
      version,
      traceId,
      commandInstanceId,
      command: name,
      commandIssuedTimestamp: issuedTimestamp
    });
  });
});
