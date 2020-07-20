const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));

const { restore, replace, fake, useFakeTimers } = require("sinon");

const put = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const writeResult = "some-write-result";
const formattedWriteResult = "some-formatted-write-result";
const query = { some: "query" };
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

const body = {
  update: {
    body: {
      a: 1,
    },
    trace: 2,
    context: 3,
  },
  context,
  query,
  id,
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
        "body.some": "query",
        "headers.id": id,
        "headers.context.root": envContextRoot,
        "headers.context.domain": "some-env-context",
        "headers.context.service": envContextService,
        "headers.context.network": envContextNetwork,
      },
      data: {
        "body.a": 1,
        "headers.id": id,
        "headers.trace": 2,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.modified": deps.dateString(),
      },
    });
    expect(formatFake).to.have.been.calledWith(writeResult);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(formattedWriteResult);
  });

  it("should call with the correct params with custom fn", async () => {
    const writeFake = fake.returns(writeResult);
    const formatFake = fake.returns(formattedWriteResult);

    const req = {
      body,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const fnFake = fake.returns({ body: { c: 3 }, headers: { b: 2 } });
    await put({ writeFn: writeFake, updateFn: fnFake, formatFn: formatFake })(
      req,
      res
    );

    expect(writeFake).to.have.been.calledWith({
      query: {
        "body.some": "query",
        "headers.id": id,
        "headers.context.root": envContextRoot,
        "headers.context.domain": "some-env-context",
        "headers.context.service": envContextService,
        "headers.context.network": envContextNetwork,
      },
      data: {
        "body.c": 3,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.modified": deps.dateString(),
      },
    });
    expect(fnFake).to.have.been.calledWith({
      body: { a: 1 },
      trace: 2,
      context: 3,
    });
    expect(formatFake).to.have.been.calledWith(writeResult);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(formattedWriteResult);
  });
  it("should return successfully if query and id are missing", async () => {
    const writeFake = fake.returns(writeResult);
    const formatFake = fake.returns(formattedWriteResult);

    const req = {
      body: {
        update: {
          body: {
            a: 1,
          },
          trace: 2,
          context: 3,
        },
        context,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    await put({ writeFn: writeFake, formatFn: formatFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: {
        "headers.context.root": envContextRoot,
        "headers.context.domain": "some-env-context",
        "headers.context.service": envContextService,
        "headers.context.network": envContextNetwork,
      },
      data: {
        "body.a": 1,
        "headers.trace": 2,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.modified": deps.dateString(),
      },
    });
    expect(formatFake).to.have.been.calledWith(writeResult);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith(formattedWriteResult);
  });
  it("should throw if context is missing", async () => {
    const writeFake = fake();

    const req = {
      body: {
        query: {},
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    const fnFake = fake.returns({ $set: { b: 2 } });

    try {
      await put({ writeFn: writeFake, fn: fnFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw if correct context is missing", async () => {
    const writeFake = fake();

    const req = {
      body: {
        query: {},
        context: {},
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    const fnFake = fake.returns({ $set: { b: 2 } });

    try {
      await put({ writeFn: writeFake, fn: fnFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
});
