const { expect } = require("chai").use(require("sinon-chai"));

const { restore, fake, replace } = require("sinon");

const createBlock = require("..");
const deps = require("../deps");

describe("Event store post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const createBlockTransactionResult = "some-post-transaction-result";
    const createBlockTransactionFake = fake.returns(
      createBlockTransactionResult
    );
    replace(deps, "createBlockTransaction", createBlockTransactionFake);

    const req = {};

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const hashFn = "some-hash-fn";
    const saveSnapshotFn = "some-save-snapshot-fn";
    const aggregateFn = "some-aggregate-fn";
    const rootStreamFn = "some-root-stream-fn";
    const latestBlockFn = "some-latest-block-fn";
    const saveBlockFn = "some-save-block-fn";
    const public = "some public";

    const createTransactionFnFake = fake();
    await createBlock({
      saveSnapshotFn,
      aggregateFn,
      rootStreamFn,
      hashFn,
      latestBlockFn,
      saveBlockFn,
      createTransactionFn: createTransactionFnFake,
      public,
    })(req, res);

    expect(createTransactionFnFake).to.have.been.calledWith(
      createBlockTransactionResult
    );
    expect(createBlockTransactionFake).to.have.been.calledWith({
      saveSnapshotFn,
      hashFn,
      aggregateFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      public,
    });
    expect(sendStatusFake).to.have.been.calledWith(200);
  });
});
