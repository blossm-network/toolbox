const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const get = require("..");
const deps = require("../deps");

const obj = { a: "some-obj" };
const sort = "some-sort";
const root = "some-root";
const objRoot = "some-obj-root";

const envContext = "some-env-context";
const envContextRoot = "some-env-context-root";
const envContextService = "some-env-context-service";
const envContextNetwork = "some-env-context-network";

const envDomain = "some-env-domain";
const envService = "some-env-service";
const envNetwork = "some-env-network";

const context = {
  [envContext]: {
    root: envContextRoot,
    service: envContextService,
    network: envContextNetwork,
  },
};

process.env.CONTEXT = envContext;
process.env.NETWORK = envNetwork;

describe("View store get", () => {
  beforeEach(() => {
    process.env.DOMAIN = envDomain;
    process.env.SERVICE = envService;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const findFake = fake.returns([{ body: obj, headers: { root: objRoot } }]);

    const params = { root };

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params,
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({ findFn: findFake })(req, res);
    expect(findFake).to.have.been.calledWith({
      sort,
      query: {
        "body.some-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
        "headers.some-env-domain": {
          root,
          service: envService,
          network: envNetwork,
        },
      },
    });
    expect(sendFake).to.have.been.calledWith([{ ...obj, root: objRoot }]);
  });
  it("should call with the correct params with no env domain, no params, one as true", async () => {
    const findFake = fake.returns([{ body: obj, headers: { root: objRoot } }]);

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    delete process.env.DOMAIN;
    await get({ findFn: findFake, one: true, queryFn: queryFnFake })(req, res);
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      sort,
      query: {
        "body.some-other-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(sendFake).to.have.been.calledWith({ ...obj, root: objRoot });
  });
  it("should call with the correct params with no env service", async () => {
    const findFake = fake.returns([{ body: obj, headers: { root: objRoot } }]);

    const params = { root };

    const query = { "some-query-key": 1 };

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params,
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    delete process.env.SERVICE;
    await get({ findFn: findFake })(req, res);
    expect(findFake).to.have.been.calledWith({
      sort,
      query: {
        "body.some-query-key": 1,
        "headers.some-env-context": {
          root: envContextRoot,
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(sendFake).to.have.been.calledWith([{ ...obj, root: objRoot }]);
  });
  it("should throw correctly if not found", async () => {
    const findFake = fake.returns([]);

    const params = { root };
    const req = {
      query: {
        context,
      },
      params,
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const viewNotFoundFake = fake.returns(error);
    replace(deps, "resourceNotFoundError", {
      view: viewNotFoundFake,
    });

    try {
      await get({ findFn: findFake, one: true })(req, res);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if wrong context", async () => {
    const findFake = fake.returns([]);

    const params = { root };
    const req = {
      query: {
        context: {},
      },
      params,
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const wrongContextFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      wrongContext: wrongContextFake,
    });

    try {
      await get({ findFn: findFake, one: true })(req, res);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
