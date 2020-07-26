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

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const saveSnapshotFn = "some-save-snapshot-fn";
    const aggregateFn = "some-aggregate-fn";
    const rootStreamFn = "some-root-stream-fn";
    const latestBlockFn = "some-latest-block-fn";
    const saveBlockFn = "some-save-block-fn";
    const encryptFn = "some-encrypt-fn";
    const signFn = "some-sign-fn";
    const blockPublisherPublicKeyFn = "some-block-publisher-key-fn";
    const public = "some public";

    const createdTransactionResult = "some-created-transaction-result";
    const createTransactionFnFake = fake.returns(createdTransactionResult);
    await createBlock({
      saveSnapshotFn,
      aggregateFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      createTransactionFn: createTransactionFnFake,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      public,
    })(req, res);

    expect(createTransactionFnFake).to.have.been.calledWith(
      createBlockTransactionResult
    );
    expect(createBlockTransactionFake).to.have.been.calledWith({
      saveSnapshotFn,
      aggregateFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      public,
    });
    expect(sendFake).to.have.been.calledWith(createdTransactionResult);
  });
});
