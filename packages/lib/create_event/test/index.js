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
    const commandAction = "command-action!";
    const commandDomain = "command-domain!";
    const commandService = "command-service!";
    const issuedTimestamp = 23;
    const root = "root!";
    const authorizedService = "some-authorized-service";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      commandInstanceId,
      action: commandAction,
      domain: commandDomain,
      service: commandService,
      issuedTimestamp,
      authorizedService
    };

    const value = await createEvent(body, {
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root,
        topic: `did-${commandAction}.${commandDomain}.${commandService}`,
        service: authorizedService,
        version,
        traceId,
        commandInstanceId,
        commandAction,
        commandDomain,
        commandService,
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
    const commandAction = "command-action!";
    const commandDomain = "command-domain!";
    const commandService = "command-service!";
    const issuedTimestamp = 23;
    const authorizedService = "some-authorized-service";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      commandInstanceId,
      action: commandAction,
      domain: commandDomain,
      service: commandService,
      issuedTimestamp,
      authorizedService
    };

    const value = await createEvent(body, {
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root: newUuid,
        topic: `did-${commandAction}.${commandDomain}.${commandService}`,
        service: authorizedService,
        version,
        traceId,
        commandInstanceId,
        commandAction,
        commandDomain,
        commandService,
        commandIssuedTimestamp: issuedTimestamp,
        createdTimestamp: datetime.fineTimestamp()
      },
      payload
    });
  });
});
