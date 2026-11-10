import { expect } from "chai";
import sinonChai from "sinon-chai";
import * as chai from "chai";
import { fake, replace, restore } from "sinon";
import * as api from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);

describe("View store DELETE HTTP adapter", () => {
  afterEach(restore);

  it("exposes only the default HTTP handler", () => {
    expect(Object.keys(api)).to.deep.equal(["default"]);
  });

  it("forwards options, ID, query and context and sends even a zero deletion result", async () => {
    const result = { deletedCount: 0 };
    const operation = fake.resolves(result);
    const factory = fake.returns(operation);
    replace(deps, "remove", factory);
    const options = { removeFn() {} };
    const query = { active: true };
    const context = { tenant: { root: "A" } };
    const res = { status: fake(() => res), send: fake() };
    await api.default(options)(
      { params: { id: "view" }, query: { query, context } },
      res,
    );
    expect(factory).to.have.been.calledWithExactly(options);
    expect(operation).to.have.been.calledWithExactly({
      id: "view",
      query,
      context,
    });
    expect(res.status).to.have.been.calledWithExactly(200);
    expect(res.send).to.have.been.calledWithExactly(result);
  });

  it("propagates the shared operation failure without sending success", async () => {
    const failure = new Error("delete failed");
    replace(deps, "remove", fake.returns(fake.rejects(failure)));
    const res = { status: fake() };
    let actual;
    try {
      await api.default({})({ params: { id: "view" }, query: {} }, res);
    } catch (error) {
      actual = error;
    }
    expect(actual).to.equal(failure);
    expect(res.status).not.to.have.been.called;
  });

  it("composes with the actual library and keeps the ID/query tenant boundary", async () => {
    const previous = process.env.CONTEXT;
    process.env.CONTEXT = "tenant";
    try {
      const context = {
        tenant: { root: "A", service: "core", network: "local" },
      };
      const removeFn = fake.resolves({ deletedCount: 1 });
      const res = { status: fake(() => res), send: fake() };
      await api.default({ removeFn })(
        { params: { id: "view" }, query: { query: { active: true }, context } },
        res,
      );
      expect(removeFn).to.have.been.calledWithExactly({
        "headers.id": "view",
        "body.active": true,
        "headers.context": {
          root: "A",
          domain: "tenant",
          service: "core",
          network: "local",
        },
      });
      expect(res.status).to.have.been.calledWithExactly(200);
      expect(res.send).to.have.been.calledWithExactly({ deletedCount: 1 });
    } finally {
      if (previous === undefined) delete process.env.CONTEXT;
      else process.env.CONTEXT = previous;
    }
  });
});
