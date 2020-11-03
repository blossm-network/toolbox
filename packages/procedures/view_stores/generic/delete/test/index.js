const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const del = require("..");
const deps = require("../deps");

const query = { a: 1 };
const contextRoot = "some-context-root";
const contextDomain = "some-context-domain";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";
const context = {
  [contextDomain]: {
    root: contextRoot,
    service: contextService,
    network: contextNetwork,
  },
};
const deletedCount = 3;

describe("View store delete", () => {
  beforeEach(() => {
    process.env.CONTEXT = contextDomain;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params with context and id only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const id = "some-id";
    const req = {
      query: {
        context,
        query: {},
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

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "headers.id": id,
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query and group", async () => {
    const removeFake = fake.returns({ deletedCount });

    const token = "some-token";
    const req = {
      query: {
        context,
        query,
        token,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const groups = "some-groups";
    const groupsLookupFnFake = fake.returns(groups);
    await del({
      removeFn: removeFake,
      group: true,
      groupsLookupFn: groupsLookupFnFake,
    })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "body.a": 1,
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
      "headers.groups": {
        $elemMatch: {
          $in: groups,
        },
      },
    });
    expect(groupsLookupFnFake).to.have.been.calledWith({
      token,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query and context", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      query: {
        query,
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

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "body.a": 1,
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with context and id only and no env context", async () => {
    const removeFake = fake.returns({ deletedCount });

    const id = "some-id";
    const req = {
      query: {
        context,
        query: {},
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
    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "headers.id": id,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should throw if missing root params", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      query: {},
      params: {},
    };

    const res = {};

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await del({ removeFn: removeFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
      expect(messageFake).to.have.been.calledWith("Missing query.");
    }
  });
  it("should throw correctly if context forbidden", async () => {
    const req = {
      query: {
        context: {},
        query: {},
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      process.env.CONTEXT = "something-other-context";
      await del({})(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This context is forbidden.",
        {
          info: {
            context: {},
          },
        }
      );
      expect(e).to.equal(error);
    }
  });
});
