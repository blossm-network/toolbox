import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import { remove } from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

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

describe("Shared view remove", () => {
  it("should reject an empty selector without invoking persistence", async () => {
    const removeFn = fake.resolves({ deletedCount: 1 });
    let error;
    try {
      await remove({ removeFn })({ context, query: {} });
    } catch (caught) {
      error = caught;
    }
    expect(error && error.statusCode).to.equal(400);
    expect(removeFn).not.to.have.been.called;
  });

  it("should require the configured context before deleting", async () => {
    const removeFn = fake.resolves({ deletedCount: 1 });
    let error;
    try {
      await remove({ removeFn })({ query });
    } catch (caught) {
      error = caught;
    }
    expect(error && error.statusCode).to.equal(403);
    expect(removeFn).not.to.have.been.called;
  });

  it("allows a nonempty body query without context on a noncontextual store", async () => {
    delete process.env.CONTEXT;
    const removeFn = fake.resolves({ deletedCount: 1 });
    await remove({ removeFn })({ query: { a: 1 } });
    expect(removeFn).to.have.been.calledWithExactly({ "body.a": 1 });
  });

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
      },
      params: {
        id,
      },
    };

    const result = await remove({ removeFn: removeFake })({
      id: req.params.id,
      query: req.query.query,
      context: req.query.context,
    });
    expect(removeFake).to.have.been.calledWith({
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
      "headers.id": id,
    });
    expect(result).to.deep.equal({ deletedCount });
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
      params: {},
    };

    const result = await remove({
      removeFn: removeFake,
    })({
      id: req.params.id,
      query: req.query.query,
      context: req.query.context,
    });
    expect(removeFake).to.have.been.calledWith({
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
      "body.a": 1,
    });
    expect(result).to.deep.equal({ deletedCount });
  });
  it("should call with the correct params with query and context", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      query: {
        context,
        query,
      },
      params: {},
    };

    const result = await remove({ removeFn: removeFake })({
      id: req.params.id,
      query: req.query.query,
      context: req.query.context,
    });
    expect(removeFake).to.have.been.calledWith({
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
      "body.a": 1,
    });
    expect(result).to.deep.equal({ deletedCount });
  });
  it("should call with the correct params with context and id only and no env context", async () => {
    const removeFake = fake.returns({ deletedCount });

    const id = "some-id";
    const req = {
      query: {
        context,
        query: {},
      },
      params: {
        id,
      },
    };

    delete process.env.CONTEXT;
    const result = await remove({ removeFn: removeFake })({
      id: req.params.id,
      query: req.query.query,
      context: req.query.context,
    });
    expect(removeFake).to.have.been.calledWith({
      "headers.id": id,
    });
    expect(result).to.deep.equal({ deletedCount });
  });
  it("should throw if missing root params", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      query: {},
      params: {},
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await remove({ removeFn: removeFake })({
        id: req.params.id,
        query: req.query.query,
        context: req.query.context,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
      expect(messageFake).to.have.been.calledWith("Missing query.");
    }
  });
  it("keeps ID, query and configured context conditions together", async () => {
    const removeFn = fake.resolves({ deletedCount });
    const result = await remove({ removeFn })({ id: "view", query, context });
    expect(removeFn.firstCall.args[0]).to.deep.equal({
      "headers.id": "view",
      "body.a": 1,
      "headers.context": {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
    });
    expect(result).to.deep.equal({ deletedCount });
  });
  it("propagates persistence failure without replacing it", async () => {
    const failure = new Error("delete failed");
    let actual;
    try {
      await remove({ removeFn: fake.rejects(failure) })({
        id: "view",
        context,
      });
    } catch (error) {
      actual = error;
    }
    expect(actual).to.equal(failure);
  });
});
