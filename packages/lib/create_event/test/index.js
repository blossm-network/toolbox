const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const createEvent = require("../");
const { string: stringDate } = require("@blossm/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

const trace = "trade!";
const commandId = "command-id!";
const commandAction = "command-action!";
const commandDomain = "command-domain!";
const commandService = "command-service!";
const commandNetwork = "command-network!";
const commandIssued = "some-date";
const root = "root!";
const context = "some-context";

const payload = { a: 1 };
const version = 0;

const action = "some-action";
const domain = "some-domain";

describe("Create event", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should get called with expected params", async () => {
    const value = await createEvent({
      trace,
      context,
      action,
      domain,
      command: {
        id: commandId,
        issued: commandIssued,
        action: commandAction,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        context,
        topic: `did-${action}.${domain}.${commandService}.${commandNetwork}`,
        version,
        trace,
        created: stringDate(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued
        }
      },
      payload
    });
  });

  it("should get called with expected params if root is missing", async () => {
    const newUuid = "newUuid!";
    replace(deps, "uuid", fake.returns(newUuid));

    const value = await createEvent({
      trace,
      action,
      domain,
      command: {
        id: commandId,
        issued: commandIssued,
        action: commandAction,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      context,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root: newUuid,
        context,
        topic: `did-${action}.${domain}.${commandService}.${commandNetwork}`,
        version,
        trace,
        created: stringDate(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued
        }
      },
      payload
    });
  });
  it("should get called with expected params if authorized is missing", async () => {
    const value = await createEvent({
      trace,
      context,
      action,
      domain,
      command: {
        id: commandId,
        issued: commandIssued,
        action: commandAction,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        context,
        topic: `did-${action}.${domain}.${commandService}.${commandNetwork}`,
        version,
        trace,
        created: stringDate(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued
        }
      },
      payload
    });
  });
  it("should get called with expected params if context is missing", async () => {
    const value = await createEvent({
      trace,
      action,
      domain,
      command: {
        id: commandId,
        issued: commandIssued,
        action: commandAction,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      root,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        topic: `did-${action}.${domain}.${commandService}.${commandNetwork}`,
        version,
        trace,
        created: stringDate(),
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued
        }
      },
      payload
    });
  });
});
