const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, stub, useFakeTimers } = require("sinon");
const createEvent = require("../");
const { string: dateString } = require("@blossm/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

const pathName = "path-name!";
const pathDomain = "path-domain!";
const pathService = "path-service!";
const pathNetwork = "path-network!";
const pathTimestamp = "path-timestamp!";
const pathIssued = "some-issued-date";
const pathId = "some-id";
const pathHost = "some-path-host";
const pathHash = "some-path-hash";
const pathProcedure = "some-path-procedure";
const root = "root!";
const idempotency = "some-idempotency";

const payload = { a: 1 };
const version = 0;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const context = "some-context";

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
      action,
      domain,
      service,
      network,
      context,
      path: [
        {
          issued: pathIssued,
          id: pathId,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          timestamp: pathTimestamp,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure,
        },
      ],
      root,
      idempotency,
      payload,
      version,
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        topic: `${action}.${domain}.${service}`,
        idempotency:
          "some-idempotency-some-action-some-domain-some-service-some-path-hash",
        created: dateString(),
        action,
        domain,
        service,
        network,
        version,
      },
      payload,
      context,
    });
  });

  it("should get called with expected params if root, idempotency, and version properties are missing", async () => {
    const rootUuid = "rootUuid!";
    const idempUuid = "idemptUuid!";
    replace(
      deps,
      "uuid",
      stub().onFirstCall().returns(rootUuid).onSecondCall().returns(idempUuid)
    );

    const value = createEvent({
      action,
      domain,
      service,
      network,
      payload,
    });

    expect(value).to.deep.equal({
      headers: {
        root: rootUuid,
        topic: `${action}.${domain}.${service}`,
        idempotency: "idemptUuid!-some-action-some-domain-some-service",
        created: dateString(),
        action,
        domain,
        service,
        network,
        version: 0,
      },
      payload,
    });
  });
  it("should get called with expected params if authorized is missing", async () => {
    const value = createEvent({
      action,
      domain,
      service,
      network,
      idempotency,
      path: [
        {
          issued: pathIssued,
          id: pathId,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          timestamp: pathTimestamp,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure,
        },
      ],
      root,
      payload,
      version,
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        topic: `${action}.${domain}.${service}`,
        idempotency:
          "some-idempotency-some-action-some-domain-some-service-some-path-hash",
        created: dateString(),
        action,
        domain,
        service,
        network,
        version,
      },
      payload,
    });
  });
  it("should get called with expected params if context is missing", async () => {
    const value = createEvent({
      action,
      domain,
      service,
      network,
      path: [
        {
          issued: pathIssued,
          id: pathId,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          timestamp: pathTimestamp,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure,
        },
      ],
      root,
      idempotency,
      payload,
      version,
    });

    expect(value).to.deep.equal({
      headers: {
        root,
        topic: `${action}.${domain}.${service}`,
        idempotency:
          "some-idempotency-some-action-some-domain-some-service-some-path-hash",
        created: dateString(),
        action,
        domain,
        service,
        network,
        version,
      },
      payload,
    });
  });
});
