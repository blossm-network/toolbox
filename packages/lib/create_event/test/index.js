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
    const commandId = "command-id!";
    const commandAction = "command-action!";
    const commandDomain = "command-domain!";
    const commandService = "command-service!";
    const commandIssuedTimestamp = 23;
    const root = "root!";
    const authorizedService = "some-authorized-service";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp,
      authorizedService
    };

    const value = await createEvent(body, {
      action: commandAction,
      domain: commandDomain,
      service: commandService,
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
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });
  it("should get called with expected params if root is missin", async () => {
    const newUuid = "newUuid!";
    replace(deps, "makeUuid", fake.returns(newUuid));

    const traceId = "tradeId!";
    const commandId = "commandId!";
    const commandAction = "command-action!";
    const commandDomain = "command-domain!";
    const commandService = "command-service!";
    const commandIssuedTimestamp = 23;
    const authorizedService = "some-authorized-service";
    const payload = { a: 1 };
    const version = 0;

    const body = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp,
      authorizedService
    };

    const value = await createEvent(body, {
      action: commandAction,
      domain: commandDomain,
      service: commandService,
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
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });
});
