import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, match } from "sinon";

import deps from "../deps.js";
import get from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const results = "some-result";
const query = { some: "query" };
const name = "some-name";
const domain = "some-domain";
const context = "some-context";
const claims = "some-claims";

const internalTokenFn = "some-internal-token-fn";
const key = "some-key";
const externalTokenNetwork = "some-external-token-network";
const externalTokenKey = "some-external-token-key";

describe("Fact gateway get", () => {
  beforeEach(() => {
    delete process.env.NETWORK;
    process.env.NODE_ENV = "production";
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params when action and domain passed in url", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);
    const root = "some-root";
    const req = {
      query,
      params: {
        root,
      },
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await get({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);
    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
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
            })
          );
        }),
      },
    });
    expect(readFake).to.have.been.calledWith({ query, root });
    expect(sendFake).to.have.been.calledWith(results);
    expect(setResponseFake).to.have.been.calledWith({});
  });
  it("should call with the correct params streamed", async () => {
    const streamFake = fake();
    const setFake = fake.returns({
      stream: streamFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);
    const root = "some-root";
    const req = {
      query,
      params: {
        root,
      },
    };
    const endFake = fake();
    const writeFake = fake();
    const writeHeadFake = fake();
    const res = {
      end: endFake,
      write: writeFake,
      writeHead: writeHeadFake,
    };
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    await get({
      name,
      domain,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
      stream: true,
    })(req, res);
    expect(factFake).to.have.been.calledWith({
      name,
      domain,
    });
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
            })
          );
        }),
      },
    });
    expect(streamFake).to.have.been.calledWith(
      match((fn) => {
        const data = "some-data";
        fn(data);
        return writeFake.calledWith(data);
      })
    ),
      {
        query,
        root,
        onResponseFn: match((fn) => {
          const statusCode = "some-status-code";
          const headers = "some-headers";
          fn({ statusCode, headers });
          return writeHeadFake.calledWith(statusCode, headers);
        }),
      };
    expect(endFake).to.have.been.calledOnceWith();
  });
  it("should call with the correct params when headers are passed back and token, claims, context in req, raw, service and network passed in", async () => {
    const headers = "some-headers";
    const readFake = fake.returns({ body: results, headers });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);
    const reqToken = "some-req-token";
    const req = {
      context,
      claims,
      query,
      token: reqToken,
      params: {},
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };
    const nodeExternalTokenFnFake = fake();
    const service = "some-service";
    const network = "some-network";
    const raw = "some-raw";
    await get({
      name,
      domain,
      service,
      network,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
      raw,
    })(req, res);
    expect(nodeExternalTokenFnFake).to.not.have.been.called;
    expect(factFake).to.have.been.calledWith({
      name,
      domain,
      service,
      network,
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      currentToken: reqToken,
      token: {
        internalFn: internalTokenFn,
        externalFn: match((fn) => {
          const result = fn();
          return result.token == reqToken && result.type == "Bearer";
        }),
      },
    });
    expect(readFake).to.have.been.calledWith({
      query,
      raw,
    });
    expect(setResponseFake).to.have.been.calledOnceWith(headers);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledOnceWith(results);
  });
  it("should call with the correct params with node env not prod and network", async () => {
    const readFake = fake.returns({ body: results });
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);
    const req = {
      query,
      params: {},
    };
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const setResponseFake = fake.returns({
      status: statusFake,
    });
    const res = {
      set: setResponseFake,
    };
    const nodeExternalTokenResult = "some-node-external-token-result";
    const nodeExternalTokenFnFake = fake.returns(nodeExternalTokenResult);
    const network = "some-network";
    process.env.NODE_ENV = "bogus";
    await get({
      name,
      domain,
      network,
      internalTokenFn,
      nodeExternalTokenFn: nodeExternalTokenFnFake,
      key,
    })(req, res);
    expect(factFake).to.have.been.calledWith({
      name,
      domain,
      network: `snd.${network}`,
    });
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
            })
          );
        }),
      },
    });
    expect(readFake).to.have.been.calledWith({ query });
    expect(sendFake).to.have.been.calledWith(results);
    expect(setResponseFake).to.have.been.calledWith({});
  });
  it("should throw correctly if no root but root needed", async () => {
    const req = {
      context,
      query,
      params: {},
    };
    const res = {};
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await get({ root: true })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("A root is required.");
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake,
    });
    const factFake = fake.returns({
      set: setFake,
    });
    replace(deps, "fact", factFake);
    const req = {
      context,
      query,
      params: {},
    };
    const res = {};
    try {
      await get({ name, domain })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
