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
    const rootStreamFn = "some-root-stream-fn";
    const latestBlockFn = "some-latest-block-fn";
    const saveBlockFn = "some-save-block-fn";
    const encryptFn = "some-encrypt-fn";
    const signFn = "some-sign-fn";
    const findOneSnapshotFn = "some-find-one-snapshot-fn";
    const eventStreamFn = "some-event-stream-fn";
    const handlers = "some-handlers";
    const blockPublisherPublicKeyFn = "some-block-publisher-key-fn";
    const isPublic = "some public";

    const createdTransactionResult = "some-created-transaction-result";
    const createTransactionFnFake = fake.returns({
      block: createdTransactionResult,
      full: false,
    });
    const createBlockFnFake = fake();
    await createBlock({
      saveSnapshotFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      createTransactionFn: createTransactionFnFake,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      findOneSnapshotFn,
      eventStreamFn,
      createBlockFn: createBlockFnFake,
      handlers,
      isPublic,
    })(req, res);

    expect(createTransactionFnFake).to.have.been.calledWith(
      createBlockTransactionResult
    );
    expect(createBlockFnFake).to.not.have.been.called;
    expect(createBlockTransactionFake).to.have.been.calledWith({
      saveSnapshotFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      encryptFn,
      signFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
      blockPublisherPublicKeyFn,
      isPublic,
      blockLimit: 100,
    });
    expect(sendFake).to.have.been.calledWith(createdTransactionResult);
  });
  it("should call with the correct params if block has reached limit", async () => {
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
    const rootStreamFn = "some-root-stream-fn";
    const latestBlockFn = "some-latest-block-fn";
    const saveBlockFn = "some-save-block-fn";
    const encryptFn = "some-encrypt-fn";
    const signFn = "some-sign-fn";
    const findOneSnapshotFn = "some-find-one-snapshot-fn";
    const eventStreamFn = "some-event-stream-fn";
    const handlers = "some-handlers";
    const blockPublisherPublicKeyFn = "some-block-publisher-key-fn";
    const isPublic = "some public";

    const createdTransactionResult = "some-created-transaction-result";
    const createTransactionFnFake = fake.returns({
      block: createdTransactionResult,
      full: true,
    });
    const createBlockFnFake = fake();
    await createBlock({
      saveSnapshotFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      createTransactionFn: createTransactionFnFake,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      findOneSnapshotFn,
      eventStreamFn,
      createBlockFn: createBlockFnFake,
      handlers,
      isPublic,
    })(req, res);

    expect(createTransactionFnFake).to.have.been.calledWith(
      createBlockTransactionResult
    );
    expect(createBlockFnFake).to.have.been.calledOnce;
    expect(createBlockTransactionFake).to.have.been.calledWith({
      saveSnapshotFn,
      rootStreamFn,
      latestBlockFn,
      saveBlockFn,
      encryptFn,
      signFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
      blockPublisherPublicKeyFn,
      isPublic,
      blockLimit: 100,
    });
    expect(sendFake).to.have.been.calledWith(createdTransactionResult);
  });
});
