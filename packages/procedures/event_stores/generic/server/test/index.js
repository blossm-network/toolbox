const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");

const findSnapshotsFn = "some-find-snapshots-fn";
const findEventsFn = "some-find-events-fn";
const findOneSnapshotFn = "some-find-one-snapshot-fn";
const eventStreamFn = "some-event-steam-fn";
const handlers = "some-handlers";
const reserveRootCountsFn = "some-reserve-root-counts-fn";
const aggregateStreamFn = "some-aggregate-stream-fn";
const rootStreamFn = "some-root-stream-fn";
const countFn = "some-count-fn";
const saveEventsFn = "some-save-events-fn";
const publishFn = "some-publish-fn";
const saveBlockFn = "some-save-block-fn";
const createTransactionFn = "some-create-transaction-fn";
const idempotencyConflictCheckFn = "some-idempotency-conflict-check-fn";
const latestBlockFn = "some-latest-block-fn";
const saveSnapshotFn = "some-save-snapshot-fn";
const encryptFn = "some-encrypt-fn";
const signFn = "some-sign-fn";
const blockPublisherPublicKeyFn = "some-block-publisher-public-key-fn";

describe("Event store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const eventStore = require("..");
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake,
    });
    const createBlockFake = fake.returns({
      post: postFake,
    });
    const getFake = fake.returns({
      post: createBlockFake,
    });
    const rootStreamFake = fake.returns({
      get: getFake,
    });
    const countFake = fake.returns({
      get: rootStreamFake,
    });
    const aggregateStreamFake = fake.returns({
      get: countFake,
    });
    const serverFake = fake.returns({
      get: aggregateStreamFake,
    });
    replace(deps, "server", serverFake);
    const eventStoreGetResult = "some-get-result";
    const eventStoreGetFake = fake.returns(eventStoreGetResult);
    replace(deps, "get", eventStoreGetFake);
    const eventStoreAggregateStreamResult = "some-aggregate-stream-result";
    const eventStoreAggregateStreamFake = fake.returns(
      eventStoreAggregateStreamResult
    );
    replace(deps, "aggregateStream", eventStoreAggregateStreamFake);
    const eventStoreRootStreamResult = "some-root-stream-result";
    const eventStoreRootStreamFake = fake.returns(eventStoreRootStreamResult);
    replace(deps, "rootStream", eventStoreRootStreamFake);
    const eventStoreCreateBlockResult = "some-create-block-result";
    const eventStoreCreateBlockFake = fake.returns(eventStoreCreateBlockResult);
    replace(deps, "createBlock", eventStoreCreateBlockFake);
    const eventStoreCountResult = "some-count-result";
    const eventStoreCountFake = fake.returns(eventStoreCountResult);
    replace(deps, "count", eventStoreCountFake);
    const eventStorePostResult = "some-post-result";
    const eventStorePostFake = fake.returns(eventStorePostResult);
    replace(deps, "post", eventStorePostFake);
    const public = "some-public";
    await eventStore({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
      reserveRootCountsFn,
      saveEventsFn,
      aggregateStreamFn,
      publishFn,
      rootStreamFn,
      createTransactionFn,
      latestBlockFn,
      saveBlockFn,
      idempotencyConflictCheckFn,
      countFn,
      saveSnapshotFn,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      public,
    });
    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(getFake).to.have.been.calledWith(eventStoreGetResult, {
      path: "/:root?",
    });
    expect(aggregateStreamFake).to.have.been.calledWith(
      eventStoreAggregateStreamResult,
      {
        path: "/stream-aggregates",
      }
    );
    expect(rootStreamFake).to.have.been.calledWith(eventStoreRootStreamResult, {
      path: "/roots",
    });
    expect(countFake).to.have.been.calledWith(eventStoreCountResult, {
      path: "/count/:root",
    });
    expect(createBlockFake).to.have.been.calledWith(
      eventStoreCreateBlockResult,
      {
        path: "/create-block",
      }
    );
    expect(postFake).to.have.been.calledWith(eventStorePostResult);
    expect(eventStoreGetFake).to.have.been.calledWith({
      findSnapshotsFn,
      findEventsFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    expect(eventStoreAggregateStreamFake).to.have.been.calledWith({
      aggregateStreamFn,
    });
    expect(eventStoreRootStreamFake).to.have.been.calledWith({ rootStreamFn });
    expect(eventStoreCountFake).to.have.been.calledWith({ countFn });
    expect(eventStoreCreateBlockFake).to.have.been.calledWith({
      saveSnapshotFn,
      rootStreamFn,
      createTransactionFn,
      saveBlockFn,
      latestBlockFn,
      encryptFn,
      signFn,
      blockPublisherPublicKeyFn,
      public,
    });
    expect(eventStorePostFake).to.have.been.calledWith({
      saveEventsFn,
      reserveRootCountsFn,
      publishFn,
      idempotencyConflictCheckFn,
      createTransactionFn,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
  });
});
