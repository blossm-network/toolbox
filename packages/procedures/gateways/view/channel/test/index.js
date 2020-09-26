const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const name = "some-name";

const context = "some-context";

describe("View gateway get", () => {
  beforeEach(() => {
    process.env.CONTEXT = context;
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const queryContextRoot = "some-query-context-root";
    const queryContextService = "some-query-context-service";
    const queryContextNetwork = "some-query-context-network";
    const queryContext = {
      [context]: {
        root: queryContextRoot,
        service: queryContextService,
        network: queryContextNetwork,
      },
    };
    const key = "some-a-key";
    const query = {
      name,
      context: queryContext,
      key,
    };

    const req = {
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const channelName = "some-channel-name";
    const channelNameFake = fake.returns(channelName);
    replace(deps, "channelName", channelNameFake);
    await get(req, res);

    expect(sendFake).to.have.been.calledWith(channelName);
    expect(channelNameFake).to.have.been.calledWith({
      name,
      key: "some-a-key",
      context: {
        root: queryContextRoot,
        domain: context,
        service: queryContextService,
        network: queryContextNetwork,
      },
    });
  });
  it("should call with the correct params with no env context and principal", async () => {
    const contextPrincipalRoot = "some-context-principal-root";
    const contextPrincipalService = "some-context-principal-service";
    const contextPrincipalNetwork = "some-context-principal-network";

    const context = {
      principal: {
        root: contextPrincipalRoot,
        service: contextPrincipalService,
        network: contextPrincipalNetwork,
        bogus: "any",
      },
    };

    const query = {
      name,
      context,
    };

    const req = {
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const channelName = "some-channel-name";
    const channelNameFake = fake.returns(channelName);
    replace(deps, "channelName", channelNameFake);

    delete process.env.CONTEXT;
    await get(req, res);

    expect(sendFake).to.have.been.calledWith(channelName);
    expect(channelNameFake).to.have.been.calledWith({
      name,
      principal: {
        root: contextPrincipalRoot,
        service: contextPrincipalService,
        network: contextPrincipalNetwork,
      },
    });
  });
  it("should throw if no context property", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      await get({ query: { context: {} } });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw if no context", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      await get({ query: {} });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
});
