const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));

const { restore, fake, useFakeTimers } = require("sinon");

const put = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const writeResultBody = "some-write-result-body";
const writeResultId = "some-write-result-id";
const writeResultContext = "some-write-result-context";
const writeResultGroups = "some-write-result-groups";
const writeResultCreated = "some-write-result-created";
const writeResultModified = "some-write-result-modified";

const trace1 = "some-trace";
const trace2 = "some-other-trace";
const writeResult = {
  body: writeResultBody,
  headers: {
    id: writeResultId,
    context: writeResultContext,
    groups: writeResultGroups,
    created: writeResultCreated,
    modified: writeResultModified,
  },
  trace: {
    "some-service": {
      "some-domain": [trace1],
    },
    "some-other-service": {
      "some-other-domain": [trace2],
    },
    "another-service": {
      "another-domain": [trace1],
    },
  },
};
const formattedWriteResult = { a: "some-formatted-write-result" };
const envContext = "some-env-context";
const envContextRoot = "some-env-context-root";
const envContextService = "some-env-context-service";
const envContextNetwork = "some-env-context-network";
const envNetwork = "some-env-network";
const envName = "some-env-name";
const coreNetwork = "some-core-network";

const context = {
  [envContext]: {
    root: envContextRoot,
    service: envContextService,
    network: envContextNetwork,
  },
};

const id = "some-id";

const traceService = "some-trace-service";
const traceDomain = "some-trace-domain";
const traceTxIds = "some-trace-tx-ids";
const upsert = "some-upsert";

const body = {
  upsert,
  trace: {
    service: traceService,
    domain: traceDomain,
    txIds: traceTxIds,
  },
  update: {
    a: 1,
  },
  context,
};

process.env.NAME = envName;
process.env.NETWORK = envNetwork;
process.env.CORE_NETWORK = coreNetwork;

describe("View store put", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
    process.env.CONTEXT = envContext;
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(writeResult);
    const formatFake = fake.returns(formattedWriteResult);

    const req = {
      body,
      params: {
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await put({ writeFn: writeFake, formatFn: formatFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.id": id,
      },
      data: {
        "body.a": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
        [`trace.${traceService}.${traceDomain}`]: traceTxIds,
        "headers.modified": deps.dateString(),
      },
    });
    expect(formatFake).to.have.been.calledWith({
      body: writeResultBody,
      id: writeResultId,
      created: writeResultCreated,
      modified: writeResultModified,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      view: {
        ...formattedWriteResult,
        headers: {
          id: writeResultId,
          context: writeResultContext,
          trace: [trace1, trace2],
          groups: writeResultGroups,
          created: writeResultCreated,
          modified: writeResultModified,
        },
      },
    });
  });

  it("should call with the correct params with custom fn no context, with updateKey", async () => {
    const writeFake = fake.returns({
      ...writeResult,
      body: { g: { m: [{ n: 10 }, { n: 11 }] } },
    });
    const formatFake = fake.returns(formattedWriteResult);

    const req = {
      body: {
        trace: {
          service: traceService,
          domain: traceDomain,
          txIds: traceTxIds,
        },
        update: {
          a: 1,
        },
      },
      params: {
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const fnFake = fake.returns({ c: 3, d: 4, e: 5 });
    await put({
      writeFn: writeFake,
      updateFn: fnFake,
      formatFn: formatFake,
      updateKey: "g.m.n",
    })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.id": id,
      },
      data: {
        "body.c": 3,
        "body.d": 4,
        "body.e": 5,
        "headers.id": id,
        "headers.modified": deps.dateString(),
        [`trace.${traceService}.${traceDomain}`]: traceTxIds,
      },
    });
    expect(fnFake).to.have.been.calledWith({ a: 1 });
    expect(formatFake).to.have.been.calledWith({
      body: { g: { m: [{ n: 10 }, { n: 11 }] } },
      id: writeResultId,
      created: writeResultCreated,
      modified: writeResultModified,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      view: {
        ...formattedWriteResult,
        headers: {
          id: writeResultId,
          context: writeResultContext,
          trace: [trace1, trace2],
          groups: writeResultGroups,
          created: writeResultCreated,
          modified: writeResultModified,
        },
      },
      keys: [10, 11],
    });
  });
  it("should call with the correct params with groups and no env context", async () => {
    const writeFake = fake.returns({
      ...writeResult,
      body: { g: 10 },
    });
    const formatFake = fake.returns(formattedWriteResult);

    const group1Root = "some-group1-root";
    const group1Service = "some-group1-service";
    const group1Network = "some-group1-network";

    const group2Root = "some-group2-root";
    const group2Service = "some-group2-service";
    const group2Network = "some-group2-network";

    const req = {
      body: {
        ...body,
        groups: [
          {
            root: group1Root,
            service: group1Service,
            network: group1Network,
            bogus: "yep",
          },
          {
            root: group2Root,
            service: group2Service,
            network: group2Network,
          },
        ],
      },
      params: {
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    delete process.env.CONTEXT;
    await put({ writeFn: writeFake, formatFn: formatFake, updateKey: "g" })(
      req,
      res
    );

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.id": id,
      },
      data: {
        "body.a": 1,
        "headers.id": id,
        "headers.modified": deps.dateString(),
        "headers.groups": [
          {
            root: group1Root,
            service: group1Service,
            network: group1Network,
          },
          {
            root: group2Root,
            service: group2Service,
            network: group2Network,
          },
        ],
        [`trace.${traceService}.${traceDomain}`]: traceTxIds,
      },
    });
    expect(formatFake).to.have.been.calledWith({
      body: { g: 10 },
      id: writeResultId,
      created: writeResultCreated,
      modified: writeResultModified,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      view: {
        ...formattedWriteResult,
        headers: {
          id: writeResultId,
          context: writeResultContext,
          trace: [trace1, trace2],
          groups: writeResultGroups,
          created: writeResultCreated,
          modified: writeResultModified,
        },
      },
      keys: [10],
    });
  });
  it("should call with the correct params with no write result", async () => {
    const writeFake = fake.returns();
    const formatFake = fake.returns(formattedWriteResult);

    const req = {
      body,
      params: {
        id,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await put({ writeFn: writeFake, formatFn: formatFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.id": id,
      },
      data: {
        "body.a": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
        [`trace.${traceService}.${traceDomain}`]: traceTxIds,
        "headers.modified": deps.dateString(),
      },
    });
    expect(formatFake).to.not.have.been.called;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
});
