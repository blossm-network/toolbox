const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const get = require("..");

const name = "some-name";

const context = "some-context";
process.env.CONTEXT = context;

describe("View gateway get", () => {
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
    const query = {
      name,
      context: queryContext,
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

    await get(req, res);

    expect(sendFake).to.have.been.calledWith(
      `${name}.${context}.${queryContextRoot}.${queryContextService}.${queryContextNetwork}`
    );
  });
  it("should call with the correct params with domain and service", async () => {
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
    const query = {
      name,
      context: queryContext,
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

    const domain = "some-domain";
    const service = "some-service";
    process.env.DOMAIN = domain;
    process.env.SERVICE = service;

    await get(req, res);

    expect(sendFake).to.have.been.calledWith(
      `${name}.${domain}.${service}.${context}.${queryContextRoot}.${queryContextService}.${queryContextNetwork}`
    );
  });
});
