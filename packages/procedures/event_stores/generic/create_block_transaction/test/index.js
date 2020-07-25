const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));

const { restore, fake, match, stub, replace, useFakeTimers } = require("sinon");

const create = require("..");
const deps = require("../deps");

let clock;
const now = new Date();

const transaction = "some-transaction";

const snapshotNonce = "some-snapshot-nonce";
const blockNonce = "some-block-nonce";
const previousHash = "some-previous-hash";
const root = "some-root";
const publicKey = "some-public-key";
const snapshotHash = "some-snapshot-hash";
const aggregateLastEventNumber = "some-snapshot-last-event-number";
const aggregateState = "some-aggregate-state";
const aggregateContext = "some-aggregate-context";
const eventCononicalString = "some-event-connical-string";
const eventPayloadCononicalString = "some-event-payload-cononical-string";
const snapshotCononicalString = "some-snapshot-cononical-string";
const snapshotStateCononicalString = "some-snapshot-state-cononical-string";
const eventsMerkleRoot = "some-events-merkle-root";
const snapshotMerkleRoot = "some-snapshot-merkle-root";
const eventKeyHash = "some-event-key-hash";
const contextHash = "some-context-hash";
const stateHash = "some-state-hash";
const blockHeadersHash = "some-block-headers-hash";
const snapshotHeadersHash = "some-snapshot-headers-hash";
const snapshotRootHash = "some-snapshot-root-hash";
const encodedEventPairs = "some-encoded-event-pairs";
const encodedAllEventPairs = "some-encoded-all-event-pairs";
const encodedSnapshotPairs = "some-encoded-snapshot-pairs";
const savedSnapshotRoot = "some-saved-snapshot-root";
const signedBlockHeaderHash = "some-signed-block-header-hash";
const savedSnapshotState = "some-saved-snapshot-state";
const savedSnapshotHash = "some-saved-snapshot-hash";
const savedSnapshotContext = "some-saved-snapshot-context";
const savedSnapshotHeaders = {
  root: savedSnapshotRoot,
};
const savedSnapshotEvents = "some-saved-snapshot-events";
const snapshot = {
  hash: savedSnapshotHash,
  context: savedSnapshotContext,
  headers: savedSnapshotHeaders,
  state: savedSnapshotState,
  events: savedSnapshotEvents,
};
const allEventsMerkleRoot = "some-all-events-merkle-root";
const previousNumber = 4;
const previousEnd = "some-previous-end";
const eventHash = "some-event-hash";
const eventPayload = "some-event-payload";
const event = {
  hash: eventHash,
  payload: eventPayload,
};
const public = true;

const network = "some-env-network";
const service = "some-env-service";
const domain = "some-env-domain";
process.env.NETWORK = network;
process.env.SERVICE = service;
process.env.DOMAIN = domain;

describe("Event store create block transaction", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root });

    const aggregate = {
      events: [event],
      snapshotHash,
      lastEventNumber: aggregateLastEventNumber,
      context: aggregateContext,
      state: aggregateState,
    };
    const aggregateFnFake = fake.resolves(aggregate);

    const cononicalStringFake = stub()
      .onFirstCall()
      .returns(eventCononicalString)
      .onSecondCall()
      .returns(snapshotCononicalString);
    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => eventKeyHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => stateHash,
      })
      .onCall(3)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(4)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(5)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

    const nonceFake = stub()
      .onCall(0)
      .returns(snapshotNonce)
      .onCall(1)
      .returns(blockNonce);
    replace(deps, "nonce", nonceFake);
    const saveSnapshotFnFake = fake.returns(snapshot);

    const saveBlockFnFake = fake();
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedEventPairs)
      .onCall(1)
      .returns(encodedAllEventPairs)
      .onCall(2)
      .returns(encodedSnapshotPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    await create({
      saveSnapshotFn: saveSnapshotFnFake,
      aggregateFn: aggregateFnFake,
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      public,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 100,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake.getCall(0)).to.have.been.calledWith(event);

    expect(hashFake.getCall(0)).to.have.been.calledWith(eventHash);
    expect(hashFake.getCall(1)).to.have.been.calledWith(aggregateContext);
    expect(hashFake.getCall(2)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      nonce: snapshotNonce,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      pHash: snapshotHash,
      created: deps.dateString(),
      root,
      public,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 1,
      eRoot: eventsMerkleRoot,
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: snapshotNonce,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          pHash: snapshotHash,
          created: deps.dateString(),
          root,
          public,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 1,
          eRoot: eventsMerkleRoot,
        },
        context: aggregateContext,
        state: aggregateState,
        events: encodedEventPairs,
      },
      transaction,
    });
    expect(hashFake.getCall(4)).to.have.been.calledWith(savedSnapshotRoot);
    expect(cononicalStringFake.getCall(1)).to.have.been.calledWith({
      hash: savedSnapshotHash,
      headers: savedSnapshotHeaders,
      context: savedSnapshotContext,
      state: savedSnapshotState,
    });
    expect(merkleRootFake.getCall(1)).to.have.been.calledWith([
      [snapshotRootHash, snapshotCononicalString],
    ]);
    expect(merkleRootFake.getCall(2)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(hashFake.getCall(5)).to.have.been.calledWith({
      nonce: blockNonce,
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 1,
      sCount: 1,
      eRoot: allEventsMerkleRoot,
      sRoot: snapshotMerkleRoot,
      network,
      service,
      domain,
      key: publicKey,
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          nonce: blockNonce,
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 1,
          sCount: 1,
          eRoot: allEventsMerkleRoot,
          sRoot: snapshotMerkleRoot,
          network,
          service,
          domain,
          key: publicKey,
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with public keys and no transaction", async () => {
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root });

    const aggregate = {
      events: [event],
      snapshotHash,
      lastEventNumber: aggregateLastEventNumber,
      context: aggregateContext,
      state: aggregateState,
    };
    const aggregateFnFake = fake.resolves(aggregate);

    const cononicalStringFake = stub()
      .onCall(0)
      .returns(eventPayloadCononicalString)
      .onCall(1)
      .returns(eventCononicalString)
      .onCall(2)
      .returns(snapshotStateCononicalString)
      .onCall(3)
      .returns(snapshotCononicalString);
    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => eventKeyHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => stateHash,
      })
      .onCall(3)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(4)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(5)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

    const nonceFake = stub()
      .onCall(0)
      .returns(snapshotNonce)
      .onCall(1)
      .returns(blockNonce);
    replace(deps, "nonce", nonceFake);
    const saveSnapshotFnFake = fake.returns(snapshot);

    const saveBlockFnFake = fake();
    const encryptedEventPayload = "some-encrypted-event-payload";
    const encryptedSnapshotState = "some-encrypted-snapshot-state";
    const encryptFnFake = stub()
      .onCall(0)
      .returns(encryptedEventPayload)
      .onCall(1)
      .returns(encryptedSnapshotState);

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedEventPairs)
      .onCall(1)
      .returns(encodedAllEventPairs)
      .onCall(2)
      .returns(encodedSnapshotPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    await create({
      saveSnapshotFn: saveSnapshotFnFake,
      aggregateFn: aggregateFnFake,
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      public: false,
    })();

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 100,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake.getCall(0)).to.have.been.calledWith(
      eventPayload
    );
    expect(cononicalStringFake.getCall(1)).to.have.been.calledWith({
      ...event,
      payload: encryptedEventPayload,
    });
    expect(encryptFnFake.getCall(0)).to.have.been.calledWith(
      eventPayloadCononicalString
    );

    expect(hashFake.getCall(0)).to.have.been.calledWith(eventHash);
    expect(hashFake.getCall(1)).to.have.been.calledWith(aggregateContext);
    expect(hashFake.getCall(2)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      nonce: snapshotNonce,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      pHash: snapshotHash,
      created: deps.dateString(),
      root,
      public: false,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 1,
      eRoot: eventsMerkleRoot,
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: snapshotNonce,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          pHash: snapshotHash,
          created: deps.dateString(),
          root,
          public: false,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 1,
          eRoot: eventsMerkleRoot,
        },
        context: aggregateContext,
        state: aggregateState,
        events: encodedEventPairs,
      },
    });
    expect(hashFake.getCall(4)).to.have.been.calledWith(savedSnapshotRoot);
    expect(cononicalStringFake.getCall(2)).to.have.been.calledWith(
      savedSnapshotState
    );
    expect(cononicalStringFake.getCall(3)).to.have.been.calledWith({
      hash: savedSnapshotHash,
      headers: savedSnapshotHeaders,
      context: savedSnapshotContext,
      state: encryptedSnapshotState,
    });
    expect(encryptFnFake.getCall(1)).to.have.been.calledWith(
      snapshotStateCononicalString
    );
    expect(merkleRootFake.getCall(1)).to.have.been.calledWith([
      [snapshotRootHash, snapshotCononicalString],
    ]);
    expect(merkleRootFake.getCall(2)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(hashFake.getCall(5)).to.have.been.calledWith({
      nonce: blockNonce,
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 1,
      sCount: 1,
      eRoot: allEventsMerkleRoot,
      sRoot: snapshotMerkleRoot,
      network,
      service,
      domain,
      key: publicKey,
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          nonce: blockNonce,
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 1,
          sCount: 1,
          eRoot: allEventsMerkleRoot,
          sRoot: snapshotMerkleRoot,
          network,
          service,
          domain,
          key: publicKey,
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
      },
    });
  });
  it("should call with the correct params and no events", async () => {
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root });

    const aggregate = {
      events: [],
      snapshotHash,
      lastEventNumber: aggregateLastEventNumber,
      context: aggregateContext,
      state: aggregateState,
    };
    const aggregateFnFake = fake.resolves(aggregate);

    const cononicalStringFake = fake();
    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(snapshotMerkleRoot)
      .onCall(1)
      .returns(allEventsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const hashFake = fake.returns({
      create: () => blockHeadersHash,
    });

    replace(deps, "hash", hashFake);

    const nonceFake = fake.returns(blockNonce);
    replace(deps, "nonce", nonceFake);
    const saveSnapshotFnFake = fake();

    const saveBlockFnFake = fake();
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedAllEventPairs)
      .onCall(1)
      .returns(encodedSnapshotPairs);

    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    await create({
      saveSnapshotFn: saveSnapshotFnFake,
      aggregateFn: aggregateFnFake,
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      public,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 100,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake).to.not.have.been.called;
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([]);
    expect(merkleRootFake.getCall(1)).to.have.been.calledWith([]);
    expect(hashFake).to.have.been.calledOnceWith({
      nonce: blockNonce,
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 0,
      sCount: 0,
      eRoot: allEventsMerkleRoot,
      sRoot: snapshotMerkleRoot,
      network,
      service,
      domain,
      key: publicKey,
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          nonce: blockNonce,
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 0,
          sCount: 0,
          eRoot: allEventsMerkleRoot,
          sRoot: snapshotMerkleRoot,
          network,
          service,
          domain,
          key: publicKey,
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with no previous snapshot", async () => {
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root });

    const aggregate = {
      events: [event],
      lastEventNumber: aggregateLastEventNumber,
      context: aggregateContext,
      state: aggregateState,
    };
    const aggregateFnFake = fake.resolves(aggregate);

    const cononicalStringFake = stub()
      .onFirstCall()
      .returns(eventCononicalString)
      .onSecondCall()
      .returns(snapshotCononicalString);
    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => eventKeyHash,
      })
      .onCall(1)
      .returns({
        create: () => contextHash,
      })
      .onCall(2)
      .returns({
        create: () => stateHash,
      })
      .onCall(3)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(4)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(5)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

    const nonceFake = stub()
      .onCall(0)
      .returns(snapshotNonce)
      .onCall(1)
      .returns(blockNonce);
    replace(deps, "nonce", nonceFake);
    const saveSnapshotFnFake = fake.returns(snapshot);

    const saveBlockFnFake = fake();
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onFirstCall()
      .returns(encodedEventPairs)
      .onCall(1)
      .returns(encodedAllEventPairs)
      .onCall(2)
      .returns(encodedSnapshotPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    await create({
      saveSnapshotFn: saveSnapshotFnFake,
      aggregateFn: aggregateFnFake,
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      public,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 100,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake.getCall(0)).to.have.been.calledWith(event);

    expect(hashFake.getCall(0)).to.have.been.calledWith(eventHash);
    expect(hashFake.getCall(1)).to.have.been.calledWith(aggregateContext);
    expect(hashFake.getCall(2)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(3)).to.have.been.calledWith({
      nonce: snapshotNonce,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      pHash: "~",
      created: deps.dateString(),
      root,
      public,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 1,
      eRoot: eventsMerkleRoot,
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: snapshotNonce,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          pHash: "~",
          created: deps.dateString(),
          root,
          public,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 1,
          eRoot: eventsMerkleRoot,
        },
        context: aggregateContext,
        state: aggregateState,
        events: encodedEventPairs,
      },
      transaction,
    });
    expect(hashFake.getCall(4)).to.have.been.calledWith(savedSnapshotRoot);
    expect(cononicalStringFake.getCall(1)).to.have.been.calledWith({
      hash: savedSnapshotHash,
      headers: savedSnapshotHeaders,
      context: savedSnapshotContext,
      state: savedSnapshotState,
    });
    expect(merkleRootFake.getCall(1)).to.have.been.calledWith([
      [snapshotRootHash, snapshotCononicalString],
    ]);
    expect(merkleRootFake.getCall(2)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(hashFake.getCall(5)).to.have.been.calledWith({
      nonce: blockNonce,
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 1,
      sCount: 1,
      eRoot: allEventsMerkleRoot,
      sRoot: snapshotMerkleRoot,
      network,
      service,
      domain,
      key: publicKey,
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          nonce: blockNonce,
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 1,
          sCount: 1,
          eRoot: allEventsMerkleRoot,
          sRoot: snapshotMerkleRoot,
          network,
          service,
          domain,
          key: publicKey,
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with no previous block", async () => {
    const latestBlockFnFake = fake.returns();

    const rootStreamFnFake = stub().yieldsTo("fn", { root });

    const emptyMerkleRoot = "some-empty-merkle-root";
    const merkleRootFake = fake.returns(emptyMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const genesisPreviousHash = "some-genesis-previous-hash";
    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => genesisPreviousHash,
      })
      .onCall(1)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

    const nonceFake = stub().onCall(0).returns(blockNonce);
    replace(deps, "nonce", nonceFake);

    const saveBlockFnFake = fake();
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedAllEventPairs)
      .onCall(1)
      .returns(encodedSnapshotPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    await create({
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      public,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();

    expect(hashFake.getCall(0)).to.have.been.calledWith("~");
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([]);
    expect(hashFake.getCall(1)).to.have.been.calledWith({
      nonce: blockNonce,
      pHash: genesisPreviousHash,
      created: deps.dateString(),
      number: 0,
      start: "2020-01-01T05:00:00.000+00:00",
      end: deps.dateString(),
      eCount: 0,
      sCount: 0,
      eRoot: emptyMerkleRoot,
      sRoot: emptyMerkleRoot,
      network,
      service,
      domain,
      key: publicKey,
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          nonce: blockNonce,
          pHash: genesisPreviousHash,
          created: deps.dateString(),
          number: 0,
          start: "2020-01-01T05:00:00.000+00:00",
          end: deps.dateString(),
          eCount: 0,
          sCount: 0,
          eRoot: emptyMerkleRoot,
          sRoot: emptyMerkleRoot,
          network,
          service,
          domain,
          key: publicKey,
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
      },
      transaction,
    });
  });
});
