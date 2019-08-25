const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const createEvent = require("../");
const datetime = require("@sustainer-network/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

const traceId = "tradeId!";
const commandId = "command-id!";
const commandAction = "command-action!";
const commandDomain = "command-domain!";
const commandService = "command-service!";
const commandNetwork = "command-network!";
const commandIssuedTimestamp = 23;
const root = "root!";
const authorized = {
  service: "some-authorized-service",
  network: "some-authorized-network"
};

const payload = { a: 1 };
const version = 0;

describe("Create event", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
    process.env.NODE_ENV = "production";
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should get called with expected params", async () => {
    const params = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp,
      authorized
    };

    const value = await createEvent(params, {
      action: commandAction,
      domain: commandDomain,
      service: commandService,
      network: commandNetwork,
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root,
        topic: `did-${commandAction}.${commandDomain}.${commandService}.${commandNetwork}`,
        service: authorized.service,
        network: authorized.network,
        version,
        traceId,
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });

  it("should get called with expected params in staging", async () => {
    const params = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp,
      authorized
    };

    process.env.NODE_ENV = "staging";
    const value = await createEvent(params, {
      action: commandAction,
      domain: commandDomain,
      service: commandService,
      network: commandNetwork,
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root,
        topic: `did-${commandAction}.${commandDomain}.${commandService}.staging.${commandNetwork}`,
        service: authorized.service,
        network: authorized.network,
        version,
        traceId,
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });
  it("should get called with expected params if root is missin", async () => {
    const newUuid = "newUuid!";
    replace(deps, "makeUuid", fake.returns(newUuid));

    const params = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp,
      authorized
    };

    const value = await createEvent(params, {
      action: commandAction,
      domain: commandDomain,
      service: commandService,
      network: commandNetwork,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root: newUuid,
        topic: `did-${commandAction}.${commandDomain}.${commandService}.${commandNetwork}`,
        service: authorized.service,
        network: authorized.network,
        version,
        traceId,
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });
  it("should get called with expected params if authorized is missing", async () => {
    const params = {
      traceId,
      id: commandId,
      issuedTimestamp: commandIssuedTimestamp
    };

    const value = await createEvent(params, {
      action: commandAction,
      domain: commandDomain,
      root,
      service: commandService,
      network: commandNetwork,
      payload,
      version
    });

    expect(value).to.deep.equal({
      fact: {
        root,
        topic: `did-${commandAction}.${commandDomain}.${commandService}.${commandNetwork}`,
        version,
        traceId,
        createdTimestamp: datetime.fineTimestamp(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issuedTimestamp: commandIssuedTimestamp
        }
      },
      payload
    });
  });
});
