const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const get = require("..");

const results = "some-result";
const query = { a: 1 };
const name = "some-name";
const service = "some-service";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";
const root = "some-root";

const internalTokenFn = "some-internal-token-fn";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

const coreNetwork = "some-core-network";
const network = "some-network";
const envContext = "some-env-context";
process.env.CORE_NETWORK = coreNetwork;
process.env.NETWORK = network;
process.env.CONTEXT = envContext;

describe("View gateway get", () => {
  beforeEach(() => {
    delete process.env.NETWORK;
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params with view-store procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      query,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const nodeExternalTokenResult = "some-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await get({
      procedure: "view-store",
      name,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({ name });
    expect(setFake).to.have.been.calledWith({
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn({
            network: externalTokenNetwork,
            key: externalTokenKey,
          });
          return (
            result == nodeExternalTokenResult &&
            nodeExternalTokenFnFake.calledWith({
              network: externalTokenNetwork,
              key: externalTokenKey,
            })
          );
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with view-store procedure with custom domain, service and network", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const reqToken = "some-req-token";
    const req = {
      query,
      params: {},
      token: reqToken,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const network = "some-random-network";
    const service = "some-random-service";
    const domain = "some-random-domain";
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    process.env.NETWORK = "some-random-env-network";
    await get({
      procedure: "view-store",
      name,
      domain,
      service,
      network,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);

    expect(viewStoreFake).to.have.been.calledWith({
      name,
      domain,
      service,
      network,
    });
    expect(setFake).to.have.been.calledWith({
      currentToken: reqToken,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with context, domain, params with view-store procedure, token, context, and claims in req", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const reqToken = "some-req-token";
    const req = {
      claims,
      context,
      query,
      token: reqToken,
      params: {
        root,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const externalTokenFnFake = fake();
    await get({
      procedure: "view-store",
      name,
      domain,
      service,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);

    expect(externalTokenFnFake).to.not.have.been.called;

    expect(viewStoreFake).to.have.been.calledWith({
      name,
      domain,
      service,
    });
    expect(setFake).to.have.been.calledWith({
      claims,
      context,
      currentToken: reqToken,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith({ ...query, root });
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should throw correctly with view-store procedure", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const req = {
      context,
      query,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    try {
      await get({ procedure: "view-store", name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should call with the correct params with view-composite procedure", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const req = {
      query,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await get({
      procedure: "view-composite",
      name,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);

    expect(viewCompositeFake).to.have.been.calledWith({ name });
    expect(setFake).to.have.been.calledWith({
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn({
            network: externalTokenNetwork,
            key: externalTokenKey,
          });
          return (
            result == nodeExternalTokenResult &&
            nodeExternalTokenFnFake.calledWith({
              network: externalTokenNetwork,
              key: externalTokenKey,
            })
          );
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with context, domain, root with view-composite procedure, and token, context, and claims in req", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const reqToken = "some-req-token";
    const req = {
      claims,
      context,
      query,
      token: reqToken,
      params: {
        root,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const nodeExternalTokenFnFake = fake();
    await get({
      procedure: "view-composite",
      name,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);
    expect(nodeExternalTokenFnFake).to.not.have.been.called;

    expect(viewCompositeFake).to.have.been.calledWith({
      name,
      domain,
      service,
    });
    expect(setFake).to.have.been.calledWith({
      claims,
      context,
      currentToken: reqToken,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
        key,
      },
    });
    expect(readFake).to.have.been.calledWith({ ...query, root });
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should throw correctly with view-composite procedure", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const viewCompositeFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewComposite", viewCompositeFake);

    const req = {
      context,
      query,
      params: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    try {
      await get({ procedure: "view-composite", name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
