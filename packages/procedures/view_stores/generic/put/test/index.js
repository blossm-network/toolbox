import { expect } from "chai";
import sinonChai from "sinon-chai";
import * as chai from "chai";
import { fake, replace, restore } from "sinon";
import * as api from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);

describe("View store PUT HTTP adapter", () => {
  afterEach(restore);

  it("exposes only the default HTTP handler", () => {
    expect(Object.keys(api)).to.deep.equal(["default"]);
  });

  it("forwards options, ID and body to the shared owner and sends its result", async () => {
    const result = { view: { body: { count: 1 } } };
    const operation = fake.resolves(result);
    const factory = fake.returns(operation);
    replace(deps, "write", factory);
    const options = { writeFn() {}, formatFn() {}, updateKeys: ["count"] };
    const body = { update: { count: 1 }, query: { active: true } };
    const res = {
      status: fake(() => res),
      send: fake(),
      sendStatus: fake(),
    };
    await api.default(options)({ params: { id: "view" }, body }, res);
    expect(factory).to.have.been.calledWithExactly(options);
    expect(operation).to.have.been.calledWithExactly({ id: "view", body });
    expect(res.status).to.have.been.calledWithExactly(200);
    expect(res.send).to.have.been.calledWithExactly(result);
    expect(res.sendStatus).not.to.have.been.called;
  });

  it("ends a no-match write with 204 and no body", async () => {
    replace(deps, "write", fake.returns(fake.resolves(undefined)));
    const res = { status: fake(), send: fake(), sendStatus: fake() };
    await api.default({})({ params: { id: "view" }, body: {} }, res);
    expect(res.sendStatus).to.have.been.calledWithExactly(204);
    expect(res.status).not.to.have.been.called;
    expect(res.send).not.to.have.been.called;
  });

  it("propagates the shared operation failure without sending success", async () => {
    const failure = new Error("write failed");
    replace(deps, "write", fake.returns(fake.rejects(failure)));
    const res = { status: fake(), sendStatus: fake() };
    let actual;
    try {
      await api.default({})({ params: { id: "view" }, body: {} }, res);
    } catch (error) {
      actual = error;
    }
    expect(actual).to.equal(failure);
    expect(res.status).not.to.have.been.called;
    expect(res.sendStatus).not.to.have.been.called;
  });

  it("composes with the actual library while preserving conditions and separate filters", async () => {
    const view = { body: { count: 2 }, headers: { id: "view" }, trace: {} };
    const writeFn = fake.resolves(view);
    const body = {
      update: { count: 2 },
      query: { count: 1 },
      arrayFilters: [{ "item.id": "one" }],
    };
    const res = { status: fake(() => res), send: fake() };
    await api.default({ writeFn, formatFn: ({ body }) => body })(
      { params: { id: "view" }, body },
      res,
    );
    expect(writeFn.firstCall.args[0].query).to.deep.equal({
      "headers.id": "view",
      "body.count": 1,
    });
    expect(writeFn.firstCall.args[0].arrayFilters).to.deep.equal([
      { "item.id": "one" },
    ]);
    expect(res.status).to.have.been.calledWithExactly(200);
    expect(res.send.firstCall.args[0].view.body).to.deep.equal({ count: 2 });
  });
});
