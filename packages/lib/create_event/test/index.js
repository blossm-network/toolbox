const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, stub, useFakeTimers } = require("sinon");
const createEvent = require("../");
const { string: dateString } = require("@blossm/datetime");
const deps = require("../deps");

let clock;

const now = new Date();

const trace = "trade!";
const pathName = "path-name!";
const pathDomain = "path-domain!";
const pathService = "path-service!";
const pathNetwork = "path-network!";
const pathIssued = "some-issued-date";
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
      trace,
      action,
      domain,
      service,
      context,
      path: [
        {
          issued: pathIssued,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure
        }
      ],
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
        context,
        created: dateString(),
        path: [
          {
            issued: pathIssued,
            name: pathName,
            domain: pathDomain,
            service: pathService,
            network: pathNetwork,
            host: pathHost,
            hash: pathHash,
            procedure: pathProcedure
          }
        ]
      },
      payload
    });
  });

  it("should get called with expected params if root, idempotency, version, and path properties are missing", async () => {
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
      path: [
        {
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure
        }
      ],
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
        path: [
          {
            network: pathNetwork,
            host: pathHost,
            hash: pathHash,
            procedure: pathProcedure
          }
        ]
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
      path: [
        {
          issued: pathIssued,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure
        }
      ],
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
        path: [
          {
            issued: pathIssued,
            name: pathName,
            domain: pathDomain,
            service: pathService,
            network: pathNetwork,
            host: pathHost,
            hash: pathHash,
            procedure: pathProcedure
          }
        ]
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
      path: [
        {
          issued: pathIssued,
          name: pathName,
          domain: pathDomain,
          service: pathService,
          network: pathNetwork,
          host: pathHost,
          hash: pathHash,
          procedure: pathProcedure
        }
      ],
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
        path: [
          {
            issued: pathIssued,
            name: pathName,
            domain: pathDomain,
            service: pathService,
            network: pathNetwork,
            host: pathHost,
            hash: pathHash,
            procedure: pathProcedure
          }
        ]
      },
      payload
    });
  });
});
