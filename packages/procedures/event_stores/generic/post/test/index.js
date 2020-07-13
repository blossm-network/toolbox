const { expect } = require("chai").use(require("sinon-chai"));

const { restore, fake, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const events = "some-events";

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
    const savedEventRoot = "some-saved-event-root";
    const savedEventHeadersTopic = "some-saved-event-headers-topic";
    const savedProofId = "some-saved-proof-id";
    const createTransactionFnFake = fake.returns({
      events: [
        {
          data: {
            root: savedEventRoot,
            headers: { topic: savedEventHeadersTopic },
          },
        },
      ],
      proofs: [{ id: savedProofId }],
    });
    await post({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn: publishFnFake,
      hashFn,
      proofsFn,
      saveProofsFn,
      scheduleUpdateForProofFn: scheduleUpdateForProofFnFake,
      createTransactionFn: createTransactionFnFake,
    })(req, res);

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
      { root: savedEventRoot },
      savedEventHeadersTopic
    );
    expect(scheduleUpdateForProofFnFake).to.have.been.calledWith(savedProofId);
    expect(sendStatusFake).to.have.been.calledWith(204);
  });
});
