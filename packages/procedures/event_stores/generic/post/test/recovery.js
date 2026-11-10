import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import post from "../index.js";
import deps from "../deps.js";

const normalizeTransactionFn = (tx) => tx;

describe("Durable publication recovery", () => {
  let nodeEnv;
  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    replace(deps, "postTransaction", () => async () => ({}));
  });
  afterEach(() => {
    restore();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  });
  it("drains pending notifications even when retry events were already committed", async () => {
    const publishPendingFn = fake.resolves();
    await post({
      normalizeTransactionFn,
      idempotencyConflictCheckFn: async () => true,
      createTransactionFn: (fn) => fn(),
      publishPendingFn,
    })(
      {
        body: {
          eventData: [{ event: { headers: { idempotency: "existing" } } }],
        },
      },
      { sendStatus() {} }
    );
    expect(publishPendingFn.callCount).to.equal(1);
  });

  it("waits for commitment before draining and for delivery before responding", async () => {
    let commit, acknowledge;
    const publishPendingFn = fake(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        })
    );
    const sendStatus = fake();
    const pending = post({
      normalizeTransactionFn,
      createTransactionFn: () =>
        new Promise((resolve) => {
          commit = resolve;
        }),
      publishPendingFn,
    })({ body: { eventData: [] } }, { sendStatus });
    await new Promise(setImmediate);
    expect(publishPendingFn.callCount).to.equal(0);
    commit();
    await new Promise(setImmediate);
    expect(publishPendingFn.callCount).to.equal(1);
    expect(sendStatus.callCount).to.equal(0);
    acknowledge();
    await pending;
    expect(sendStatus.firstCall.args).to.deep.equal([204]);
  });

  it("does not dispatch or report success when the event transaction fails", async () => {
    const failure = new Error("transaction aborted");
    const publishPendingFn = fake.resolves();
    const sendStatus = fake();
    await rejects(
      post({ normalizeTransactionFn, createTransactionFn: fake.rejects(failure), publishPendingFn })(
        { body: { eventData: [] } },
        { sendStatus }
      ),
      (error) => error === failure
    );
    expect(publishPendingFn.callCount).to.equal(0);
    expect(sendStatus.callCount).to.equal(0);
  });

  it("propagates errors from the supplied recovery hook", async () => {
    const failure = new Error("publication unavailable");
    const createTransactionFn = fake.resolves();
    const sendStatus = fake();
    await rejects(
      post({ normalizeTransactionFn, createTransactionFn, publishPendingFn: fake.rejects(failure) })(
        { body: { eventData: [] } },
        { sendStatus }
      ),
      (error) => error === failure
    );
    expect(createTransactionFn.callCount).to.equal(1);
    expect(sendStatus.callCount).to.equal(0);
  });
});
