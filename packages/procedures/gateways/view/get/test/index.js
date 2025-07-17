import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, match, useFakeTimers } from "sinon";

import deps from "../deps.js";
import get from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const results = { some: "results " };
const query = { a: 1 };
const name = "some-name";
const claims = "some-claims";
const id = "some-id";

const internalTokenFn = "some-internal-token-fn";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

const coreNetwork = "some-base-network";
const network = "some-network";
const envContext = "some-env-context";
process.env.CORE_NETWORK = coreNetwork;
process.env.NETWORK = network;
process.env.CONTEXT = envContext;

const context = {
  [envContext]: "some-thing",
};

let clock;
const now = new Date();

describe("View gateway get", () => {
  beforeEach(() => {
    delete process.env.NETWORK;
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
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
      context,
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
            })
          );
        }),
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with view-store procedure with no env context", async () => {
    const readFake = fake.returns({
      body: results,
    });
    const setFake = fake.returns({
      read: readFake,
    });
    const viewStoreFake = fake.returns({
      set: setFake,
    });
    replace(deps, "viewStore", viewStoreFake);

    const token = "some-token";

    const req = {
      context,
      query,
      params: {},
      token,
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

    const externalTokenFnFake = fake();
    await get({
      procedure: "view-store",
      name,
      internalTokenFn,
      externalTokenFn: externalTokenFnFake,
      key,
    })(req, res);

    expect(externalTokenFnFake).to.not.have.been.called;

    expect(viewStoreFake).to.have.been.calledWith({
      name,
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
      },
    });
    expect(readFake).to.have.been.calledWith({ ...query, id });
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
      await get({ procedure: "view-store", name })(req, res);
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
      context,
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
            })
          );
        }),
      },
    });
    expect(readFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith(results);
  });
  it("should call with the correct params with context, domain, id with view-composite procedure, and token, context, and claims in req", async () => {
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

    const nodeExternalTokenFnFake = fake();
    await get({
      procedure: "view-composite",
      name,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);
    expect(nodeExternalTokenFnFake).to.not.have.been.called;

    expect(viewCompositeFake).to.have.been.calledWith({
      name,
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
      },
    });
    expect(readFake).to.have.been.calledWith({ ...query, id });
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
      await get({ procedure: "view-composite", name })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should redirect correctly if no context", async () => {
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

    const redirect = "some-redirect";
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await get({
        redirect,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This context is forbidden.",
        { info: { redirect } }
      );
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly if no correct context", async () => {
    const req = {
      context: {},
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

    const redirect = "some-redirect";

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await get({
        redirect,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This context is forbidden.",
        { info: { redirect } }
      );
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly if view store throws 403", async () => {
    const errMessage = "some-error-message";
    const ForbiddenError = Error;
    ForbiddenError.prototype.statusCode = 403;
    ForbiddenError.prototype.message = errMessage;
    const readFake = fake.throws(new ForbiddenError());
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

    const redirect = "some-redirect";
    const nodeExternalTokenResult = "some-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await get({
        procedure: "view-store",
        name,
        internalTokenFn,
        nodeExternalTokenFn: nodeExternalTokenFnFake,
        key,
        redirect,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(errMessage, {
        info: { redirect },
      });
      expect(e).to.equal(error);
    }
  });
  it("should redirect correctly if composite throws 403", async () => {
    const errMessage = "some-error-message";
    const ForbiddenError = Error;
    ForbiddenError.prototype.statusCode = 403;
    ForbiddenError.prototype.message = errMessage;
    const readFake = fake.throws(new ForbiddenError());
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

    const redirect = "some-redirect";
    const nodeExternalTokenResult = "some-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });
    try {
      await get({
        procedure: "view-composite",
        name,
        internalTokenFn,
        nodeExternalTokenFn: nodeExternalTokenFnFake,
        key,
        redirect,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(errMessage, {
        info: { redirect },
      });
      expect(e).to.equal(error);
    }
  });
});
