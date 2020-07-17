const { expect } = require("chai").use(require("sinon-chai"));

const { restore, fake, stub, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const events = [{ data: { headers: {} } }, { data: { headers: {} } }];

describe("Event store post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const req = {
      body: {
        events,
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";
    const hashFn = "some-hash-fn";
    const proofsFn = "some-proofs-fn";
    const saveProofsFn = "some-save-proofs-fn";

    const publishFnFake = fake();
    const scheduleUpdateForProofFnFake = fake();
    const savedEventHeadersTopic = "some-saved-event-headers-topic";
    const savedProofId = "some-saved-proof-id";
    const savedEventSavedTimestamp = "some-event-saved-timestamp";
    const createTransactionFnFake = fake.returns({
      events: [
        {
          data: {
            saved: savedEventSavedTimestamp,
            headers: { topic: savedEventHeadersTopic },
          },
        },
        {
          data: {
            saved: savedEventSavedTimestamp,
            headers: { topic: savedEventHeadersTopic },
          },
        },
      ],
      proofs: [{ id: savedProofId }],
    });
    const idempotencyConflictCheckFnFake = fake();
    await post({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn: publishFnFake,
      hashFn,
      proofsFn,
      saveProofsFn,
      scheduleUpdateForProofFn: scheduleUpdateForProofFnFake,
      createTransactionFn: createTransactionFnFake,
      idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
    })(req, res);

    expect(idempotencyConflictCheckFnFake).to.not.have.been.called;
    expect(createTransactionFnFake).to.have.been.calledWith(
      postTransactionResult
    );
    expect(postTransactionFake).to.have.been.calledWith({
      events,
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { from: savedEventSavedTimestamp },
      savedEventHeadersTopic
    );
    expect(publishFnFake).to.have.been.calledOnce;
    expect(scheduleUpdateForProofFnFake).to.have.been.calledWith(savedProofId);
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with event idempotency conflict passed in", async () => {
    const postTransactionResult = "some-post-transaction-result";
    const postTransactionFake = fake.returns(postTransactionResult);
    replace(deps, "postTransaction", postTransactionFake);

    const idempotency = "some-idempotency";
    const req = {
      body: {
        events: [
          { data: { headers: { idempotency } } },
          { data: { headers: { idempotency } } },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";
    const hashFn = "some-hash-fn";
    const proofsFn = "some-proofs-fn";
    const saveProofsFn = "some-save-proofs-fn";

    const publishFnFake = fake();
    const scheduleUpdateForProofFnFake = fake();
    const savedEventHeadersTopic = "some-saved-event-headers-topic";
    const savedProofId = "some-saved-proof-id";
    const savedEventSavedTimestamp = "some-event-saved-timestamp";
    const createTransactionFnFake = fake.returns({
      events: [
        {
          data: {
            saved: savedEventSavedTimestamp,
            headers: { topic: savedEventHeadersTopic },
          },
        },
      ],
      proofs: [{ id: savedProofId }],
    });
    const idempotencyConflictCheckFnFake = fake.returns(false);

    await post({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn: publishFnFake,
      hashFn,
      proofsFn,
      saveProofsFn,
      scheduleUpdateForProofFn: scheduleUpdateForProofFnFake,
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
      events: [{ data: { headers: { idempotency } } }],
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { from: savedEventSavedTimestamp },
      savedEventHeadersTopic
    );
    expect(scheduleUpdateForProofFnFake).to.have.been.calledWith(savedProofId);
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
        events: [
          { data: { headers: { idempotency: idempotency1 } } },
          { data: { headers: { idempotency: idempotency2 } } },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";
    const hashFn = "some-hash-fn";
    const proofsFn = "some-proofs-fn";
    const saveProofsFn = "some-save-proofs-fn";

    const publishFnFake = fake();
    const scheduleUpdateForProofFnFake = fake();
    const savedEventHeadersTopic = "some-saved-event-headers-topic";
    const savedProofId = "some-saved-proof-id";
    const savedEventSavedTimestamp = "some-event-saved-timestamp";
    const createTransactionFnFake = fake.returns({
      events: [
        {
          data: {
            saved: savedEventSavedTimestamp,
            headers: { topic: savedEventHeadersTopic },
          },
        },
      ],
      proofs: [{ id: savedProofId }],
    });
    const idempotencyConflictCheckFnFake = fake.returns(false);

    await post({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn: publishFnFake,
      hashFn,
      proofsFn,
      saveProofsFn,
      scheduleUpdateForProofFn: scheduleUpdateForProofFnFake,
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
      events: [
        { data: { headers: { idempotency: idempotency1 } } },
        { data: { headers: { idempotency: idempotency2 } } },
      ],
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { from: savedEventSavedTimestamp },
      savedEventHeadersTopic
    );
    expect(scheduleUpdateForProofFnFake).to.have.been.calledWith(savedProofId);
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
        events: [
          { data: { headers: { idempotency: idempotency1 } } },
          { data: { headers: { idempotency: idempotency2 } } },
        ],
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const saveEventsFn = "some-save-events-fn";
    const reserveRootCountsFn = "some-reserve-root-counts-fn";
    const hashFn = "some-hash-fn";
    const proofsFn = "some-proofs-fn";
    const saveProofsFn = "some-save-proofs-fn";

    const publishFnFake = fake();
    const scheduleUpdateForProofFnFake = fake();
    const savedEventHeadersTopic = "some-saved-event-headers-topic";
    const savedProofId = "some-saved-proof-id";
    const savedEventSavedTimestamp = "some-event-saved-timestamp";
    const createTransactionFnFake = fake.returns({
      events: [
        {
          data: {
            saved: savedEventSavedTimestamp,
            headers: { topic: savedEventHeadersTopic },
          },
        },
      ],
      proofs: [{ id: savedProofId }],
    });
    const idempotencyConflictCheckFnFake = stub()
      .onFirstCall()
      .returns(false)
      .onSecondCall()
      .returns(true);

    await post({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn: publishFnFake,
      hashFn,
      proofsFn,
      saveProofsFn,
      scheduleUpdateForProofFn: scheduleUpdateForProofFnFake,
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
      events: [{ data: { headers: { idempotency: idempotency1 } } }],
      saveEventsFn,
      reserveRootCountsFn,
      hashFn,
      proofsFn,
      saveProofsFn,
    });
    expect(publishFnFake).to.have.been.calledWith(
      { from: savedEventSavedTimestamp },
      savedEventHeadersTopic
    );
    expect(scheduleUpdateForProofFnFake).to.have.been.calledWith(savedProofId);
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
});
