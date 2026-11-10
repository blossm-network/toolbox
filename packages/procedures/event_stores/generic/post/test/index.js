import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake, stub, replace } from "sinon";

import post from "../index.js";
import deps from "../deps.js";

const normalizeTransactionFn = (tx) => tx;

chai.use(sinonChai);
const { expect } = chai;

const eventData = [
  { event: { headers: {} }, number: 0 },
  { event: { headers: {} } },
];
const tx = "some-tx";

describe("Event store post", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "not-local";
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const req = {
      body: {
        eventData,
        tx,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";

    const publishPendingFnFake = fake();

    const createTransactionFnFake = fake.resolves();
    const idempotencyConflictCheckFnFake = fake();
    await post({
      normalizeTransactionFn,
      saveEventsFn,
      reserveRootCountsFn,
      publishPendingFn: publishPendingFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake).to.not.have.been.called;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      normalizeTransactionFn,
      eventData,
      tx,
      saveEventsFn,
      reserveRootCountsFn,
    });
    expect(publishPendingFnFake).to.have.been.calledOnce;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with event idempotency conflict passed in", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const idempotency = "some-idempotency";
    const req = {
      body: {
        eventData: [
          { event: { headers: { idempotency } } },
          { event: { headers: { idempotency } } },
        ],
        tx,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";

    const publishPendingFnFake = fake();
    const createTransactionFnFake = fake.resolves();
    const idempotencyConflictCheckFnFake = fake.returns(false);

    await post({
      normalizeTransactionFn,
      saveEventsFn,
      reserveRootCountsFn,
      publishPendingFn: publishPendingFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
      idempotency
    );
    expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
      idempotency
    );
    expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      normalizeTransactionFn,
      eventData: [{ event: { headers: { idempotency } } }],
      tx,
      saveEventsFn,
      reserveRootCountsFn,
    });
    expect(publishPendingFnFake).to.have.been.calledOnce;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params and not publish in local", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const req = {
      body: {
        eventData,
        tx,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";

    const publishPendingFnFake = fake();

    const createTransactionFnFake = fake.resolves();
    const idempotencyConflictCheckFnFake = fake();

    process.env.NODE_ENV = "local";
    await post({
      normalizeTransactionFn,
      saveEventsFn,
      reserveRootCountsFn,
      publishPendingFn: publishPendingFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake).to.not.have.been.called;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      normalizeTransactionFn,
      eventData,
      tx,
      saveEventsFn,
      reserveRootCountsFn,
    });
    expect(publishPendingFnFake).to.not.have.been.called;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with event no idempotency passed in", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const idempotency1 = "some-idempotency1";
    const idempotency2 = "some-idempotency2";
    const req = {
      body: {
        eventData: [
          { event: { headers: { idempotency: idempotency1 } } },
          { event: { headers: { idempotency: idempotency2 } } },
        ],
        tx,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";

    const publishPendingFnFake = fake();
    const createTransactionFnFake = fake.resolves();
    const idempotencyConflictCheckFnFake = fake.returns(false);

    await post({
      normalizeTransactionFn,
      saveEventsFn,
      reserveRootCountsFn,
      publishPendingFn: publishPendingFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
      idempotency1
    );
    expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
      idempotency2
    );
    expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      normalizeTransactionFn,
      eventData: [
        { event: { headers: { idempotency: idempotency1 } } },
        { event: { headers: { idempotency: idempotency2 } } },
      ],
      tx,
      saveEventsFn,
      reserveRootCountsFn,
    });
    expect(publishPendingFnFake).to.have.been.calledOnce;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with idempotency fn conflict", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const idempotency1 = "some-idempotency1";
    const idempotency2 = "some-idempotency2";
    const req = {
      body: {
        eventData: [
          { event: { headers: { idempotency: idempotency1 } } },
          { event: { headers: { idempotency: idempotency2 } } },
        ],
        tx,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";

    const publishPendingFnFake = fake();
    const createTransactionFnFake = fake.resolves();
    const idempotencyConflictCheckFnFake = stub()
      .onFirstCall()
      .returns(false)
      .onSecondCall()
      .returns(true);

    await post({
      normalizeTransactionFn,
      saveEventsFn,
      reserveRootCountsFn,
      publishPendingFn: publishPendingFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
      idempotency1
    );
    expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
      idempotency2
    );
    expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      normalizeTransactionFn,
      eventData: [{ event: { headers: { idempotency: idempotency1 } } }],
      tx,
      saveEventsFn,
      reserveRootCountsFn,
    });
    expect(publishPendingFnFake).to.have.been.calledOnce;
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
});
