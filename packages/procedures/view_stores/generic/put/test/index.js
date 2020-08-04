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
const trace1 = "some-trace";
const trace2 = "some-other-trace";
const writeResult = {
  body: writeResultBody,
  headers: {
    id: writeResultId,
    context: writeResultContext,
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

process.env.CONTEXT = envContext;
describe("View store put", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
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
        "headers.context.root": envContextRoot,
        "headers.context.domain": "some-env-context",
        "headers.context.service": envContextService,
        "headers.context.network": envContextNetwork,
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
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      ...formattedWriteResult,
      headers: {
        id: writeResultId,
        context: writeResultContext,
        trace: [trace1, trace2],
      },
    });
  });

  it("should call with the correct params with custom fn and no context", async () => {
    const writeFake = fake.returns(writeResult);
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

    const fnFake = fake.returns({ c: 3 });
    await put({ writeFn: writeFake, updateFn: fnFake, formatFn: formatFake })(
      req,
      res
    );

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.id": id,
      },
      data: {
        "body.c": 3,
        "headers.id": id,
        "headers.modified": deps.dateString(),
        [`trace.${traceService}.${traceDomain}`]: traceTxIds,
      },
    });
    expect(fnFake).to.have.been.calledWith({ a: 1 });
    expect(formatFake).to.have.been.calledWith({
      body: writeResultBody,
      id: writeResultId,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({
      ...formattedWriteResult,
      headers: {
        id: writeResultId,
        context: writeResultContext,
        trace: [trace1, trace2],
      },
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
        "headers.context.root": envContextRoot,
        "headers.context.domain": "some-env-context",
        "headers.context.service": envContextService,
        "headers.context.network": envContextNetwork,
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
