const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, stub, useFakeTimers } = require("sinon");
const createEvent = require("../");
const { string: dateString } = require("@blossm/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

const trace = "trade!";
const commandId = "command-id!";
const commandName = "command-name!";
const commandDomain = "command-domain!";
const commandService = "command-service!";
const commandNetwork = "command-network!";
const commandIssued = "some-issued-date";
const commandAccepted = "some-accepted-date";
const commandBroadcasted = "some-broadcasted-date";
const root = "root!";
const idempotency = "some-idempotency";

const payload = { a: 1 };
const version = 0;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";

describe("Create event", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should get called with expected params", async () => {
    const value = createEvent({
      trace,
      action,
      domain,
      service,
      command: {
        id: commandId,
        issued: commandIssued,
        accepted: commandAccepted,
        broadcasted: commandBroadcasted,
        name: commandName,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      root,
      idempotency,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        idempotency,
        action,
        domain,
        service,
        topic: `did-${action}.${domain}.${service}`,
        version,
        trace,
        created: dateString(),
        command: {
          id: commandId,
          name: commandName,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued,
          accepted: commandAccepted,
          broadcasted: commandBroadcasted
        }
      },
      payload
    });
  });

  it("should get called with expected params if root, idempotency, version, and broadcasted are missing", async () => {
    const rootUuid = "rootUuid!";
    const idempUuid = "idemptUuid!";
    replace(
      deps,
      "uuid",
      stub()
        .onFirstCall()
        .returns(rootUuid)
        .onCall(1)
        .returns(idempUuid)
    );

    const value = createEvent({
      trace,
      action,
      domain,
      service,
      command: {
        id: commandId,
        issued: commandIssued,
        accepted: commandAccepted,
        name: commandName,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      payload
    });

    expect(value).to.deep.equal({
      headers: {
        root: rootUuid,
        idempotency: idempUuid,
        action,
        domain,
        service,
        topic: `did-${action}.${domain}.${service}`,
        version: 0,
        trace,
        created: dateString(),
        command: {
          id: commandId,
          name: commandName,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued,
          accepted: commandAccepted
        }
      },
      payload
    });
  });
  it("should get called with expected params if authorized is missing", async () => {
    const value = createEvent({
      trace,
      action,
      domain,
      service,
      idempotency,
      command: {
        id: commandId,
        issued: commandIssued,
        accepted: commandAccepted,
        broadcasted: commandBroadcasted,
        name: commandName,
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
        idempotency,
        action,
        domain,
        service,
        topic: `did-${action}.${domain}.${service}`,
        version,
        trace,
        created: dateString(),
        command: {
          id: commandId,
          name: commandName,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued,
          accepted: commandAccepted,
          broadcasted: commandBroadcasted
        }
      },
      payload
    });
  });
  it("should get called with expected params if context is missing", async () => {
    const value = createEvent({
      trace,
      action,
      domain,
      service,
      command: {
        id: commandId,
        issued: commandIssued,
        accepted: commandAccepted,
        broadcasted: commandBroadcasted,
        name: commandName,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork
      },
      root,
      idempotency,
      payload,
      version
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        idempotency,
        action,
        domain,
        service,
        topic: `did-${action}.${domain}.${service}`,
        version,
        trace,
        created: dateString(),
        command: {
          id: commandId,
          name: commandName,
          domain: commandDomain,
          service: commandService,
          network: commandNetwork,
          issued: commandIssued,
          accepted: commandAccepted,
          broadcasted: commandBroadcasted
        }
      },
      payload
    });
  });
});
