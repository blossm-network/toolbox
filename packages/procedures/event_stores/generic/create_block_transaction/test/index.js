import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiDatetime from "chai-datetime";
import { restore, fake, match, stub, replace, useFakeTimers } from "sinon";

import create from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
chai.use(chaiDatetime);

const { expect } = chai;

let clock;
const now = new Date();

const transaction = "some-transaction";

const previousHash = "some-previous-hash";
const blockLimit = 100;
const root = "some-root";
const publicKey = "some-public-key";
const snapshotHash = "some-snapshot-hash";
const txIds = "some-txids";
const aggregateLastEventNumber = "some-snapshot-last-event-number";
const aggregateLastNumber = 40;
const aggregateState = "some-aggregate-state";
const aggregateGroups = "some-aggregate-groups";
const aggregateContext = "some-aggregate-context";
const eventCononicalString = "some-event-connical-string";
const eventPayloadCononicalString = "some-event-payload-cononical-string";
const snapshotCononicalString = "some-snapshot-cononical-string";
const txEventsCononicalString = "some-tx-events-cononical-string";
const snapshotStateCononicalString = "some-snapshot-state-cononical-string";
const eventsMerkleRoot = Buffer.from("some-events-merkle-root");
const snapshotMerkleRoot = Buffer.from("some-snapshot-merkle-root");
const eventKeyHash = "some-event-key-hash";
const contextHash = "some-context-hash";
const groupsHash = "some-groups-hash";
const stateHash = "some-state-hash";
const blockHeadersHash = "some-block-headers-hash";
const snapshotHeadersHash = "some-snapshot-headers-hash";
const snapshotRootHash = "some-snapshot-root-hash";
const txIdHash = "some-tx-id-hash";
const encodedEventPairs = "some-encoded-event-pairs";
const encodedAllEventPairs = "some-encoded-all-event-pairs";
const encodedSnapshotPairs = "some-encoded-snapshot-pairs";
const encodedTxPairs = "some-encoded-tx-pairs";
const savedSnapshotRoot = "some-saved-snapshot-root";
const signedBlockHeaderHash = "some-signed-block-header-hash";
const savedSnapshotState = "some-saved-snapshot-state";
const savedSnapshotHash = "some-saved-snapshot-hash";
const savedSnapshotContext = "some-saved-snapshot-context";
const savedSnapshotHeaders = {
  root: savedSnapshotRoot,
};
const savedSnapshotEvents = "some-saved-snapshot-events";
const savedSnapshotGroups = "some-saved-groups-events";

const snapshot = {
  hash: savedSnapshotHash,
  context: savedSnapshotContext,
  groups: savedSnapshotGroups,
  headers: savedSnapshotHeaders,
  state: savedSnapshotState,
  events: savedSnapshotEvents,
};
const allEventsMerkleRoot = Buffer.from("some-all-events-merkle-root");
const txsMerkleRoot = Buffer.from("some-txs-merkle-root");
const previousNumber = 4;
const eventHash = "some-event-hash";
const eventPayload = "some-event-payload";
const txId = "some-tx-id";
const event = {
  hash: eventHash,
  payload: eventPayload,
  tx: {
    id: txId,
  },
};
const findOneSnapshotFn = "some-find-one-snapshot-fn";
const eventStreamFn = "some-event-stream-fn";
const handlers = "some-handlers";
const isPublic = true;

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
    const previousEnd = deps.dateString();
    const updated = deps.dateString();
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root, updated });

    const otherEventHash = "some-other-event-hash";
    const otherEvent = {
      hash: otherEventHash,
      payload: eventPayload,
      tx: {
        id: txId,
      },
    };
    const yetAnotherEventHash = "some-yet-another-event-hash";
    const txId2 = "some-tx-id2";
    const yetAnotherEvent = {
      hash: yetAnotherEventHash,
      payload: eventPayload,
      tx: {
        id: txId2,
      },
    };
    const aggregate = {
      headers: {
        snapshotHash,
        lastEventNumber: aggregateLastEventNumber,
        number: aggregateLastNumber,
      },
      events: [event, otherEvent, yetAnotherEvent],
      context: aggregateContext,
      state: aggregateState,
      groups: aggregateGroups,
      txIds,
    };
    const aggregateFnFake = fake.returns(aggregate);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const otherEventCononicalString = "some-other-event-cononical-string";
    const yetAnotherEventCononicalString =
      "some-yet-another-event-cononical-string";
    const otherTxEventsCononicalString =
      "some-other-tx-events-cononical-string";
    const cononicalStringFake = stub()
      .onCall(0)
      .returns(eventCononicalString)
      .onCall(1)
      .returns(otherEventCononicalString)
      .onCall(2)
      .returns(yetAnotherEventCononicalString)
      .onCall(3)
      .returns(snapshotCononicalString)
      .onCall(4)
      .returns(txEventsCononicalString)
      .onCall(5)
      .returns(otherTxEventsCononicalString);

    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot)
      .onCall(3)
      .returns(txsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const otherEventKeyHash = "some-other-event-key-hash";
    const yetAnotherEventKeyHash = "some-other-event-key-hash";
    const otherTxIdHash = "some-other-tx-id-hash";
    const hashFake = stub()
      .onCall(0)
      .returns({
        create: () => eventKeyHash,
      })
      .onCall(1)
      .returns({
        create: () => otherEventKeyHash,
      })
      .onCall(2)
      .returns({
        create: () => yetAnotherEventKeyHash,
      })
      .onCall(3)
      .returns({
        create: () => contextHash,
      })
      .onCall(4)
      .returns({
        create: () => groupsHash,
      })
      .onCall(5)
      .returns({
        create: () => stateHash,
      })
      .onCall(6)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(7)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(8)
      .returns({
        create: () => txIdHash,
      })
      .onCall(9)
      .returns({
        create: () => otherTxIdHash,
      })
      .onCall(10)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

    const saveSnapshotFnFake = fake.returns(snapshot);

    const saveBlockResponse = "some-save-block-response";
    const saveBlockFnFake = fake.returns(saveBlockResponse);
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedEventPairs)
      .onCall(1)
      .returns(encodedAllEventPairs)
      .onCall(2)
      .returns(encodedSnapshotPairs)
      .onCall(3)
      .returns(encodedTxPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    const response = await create({
      saveSnapshotFn: saveSnapshotFnFake,
      aggregateFn: aggregateFnFake,
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      blockLimit,
      handlers,
      isPublic,
    })(transaction);

    expect(response).to.deep.equal({ block: saveBlockResponse, full: false });
    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 10,
      reverse: true,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake.getCall(0)).to.have.been.calledWith(event);
    expect(cononicalStringFake.getCall(1)).to.have.been.calledWith(otherEvent);
    expect(cononicalStringFake.getCall(2)).to.have.been.calledWith(
      yetAnotherEvent
    );

    expect(hashFake.getCall(0)).to.have.been.calledWith(eventHash);
    expect(hashFake.getCall(1)).to.have.been.calledWith(otherEventHash);
    expect(hashFake.getCall(2)).to.have.been.calledWith(yetAnotherEventHash);
    expect(hashFake.getCall(3)).to.have.been.calledWith(aggregateContext);
    expect(hashFake.getCall(4)).to.have.been.calledWith(aggregateGroups);
    expect(hashFake.getCall(5)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(6)).to.have.been.calledWith({
      nonce: `${root}_${aggregateLastNumber + 1}`,
      number: aggregateLastNumber + 1,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      gHash: groupsHash,
      pHash: snapshotHash,
      created: deps.dateString(),
      root,
      isPublic,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 3,
      eRoot: eventsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedEventPairs),
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
      [otherEventKeyHash, otherEventCononicalString],
      [yetAnotherEventKeyHash, yetAnotherEventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: `${root}_${aggregateLastNumber + 1}`,
          number: aggregateLastNumber + 1,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          gHash: groupsHash,
          pHash: snapshotHash,
          created: deps.dateString(),
          root,
          isPublic,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 3,
          eRoot: eventsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedEventPairs),
        },
        context: aggregateContext,
        state: aggregateState,
        groups: aggregateGroups,
        events: encodedEventPairs,
        txIds,
      },
      transaction,
    });
    expect(hashFake.getCall(7)).to.have.been.calledWith(savedSnapshotRoot);
    expect(cononicalStringFake.getCall(3)).to.have.been.calledWith({
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
      [otherEventKeyHash, otherEventCononicalString],
      [yetAnotherEventKeyHash, yetAnotherEventCononicalString],
    ]);
    expect(merkleRootFake.getCall(3)).to.have.been.calledWith([
      [txIdHash, txEventsCononicalString],
      [otherTxIdHash, otherTxEventsCononicalString],
    ]);
    expect(hashFake.getCall(8)).to.have.been.calledWith(txId);
    expect(hashFake.getCall(9)).to.have.been.calledWith(txId2);
    expect(cononicalStringFake.getCall(4)).to.have.been.calledWith([
      eventHash,
      otherEventHash,
    ]);
    expect(cononicalStringFake.getCall(5)).to.have.been.calledWith([
      yetAnotherEventHash,
    ]);
    expect(hashFake.getCall(10)).to.have.been.calledWith({
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 3,
      sCount: 1,
      tCount: 2,
      eRoot: allEventsMerkleRoot.toString("base64"),
      sRoot: snapshotMerkleRoot.toString("base64"),
      tRoot: txsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedAllEventPairs),
      sSize: Buffer.byteLength(encodedSnapshotPairs),
      tSize: Buffer.byteLength(encodedTxPairs),
      network,
      service,
      domain,
      key: Buffer.from(publicKey).toString("base64"),
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 3,
          sCount: 1,
          tCount: 2,
          eRoot: allEventsMerkleRoot.toString("base64"),
          sRoot: snapshotMerkleRoot.toString("base64"),
          tRoot: txsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedAllEventPairs),
          sSize: Buffer.byteLength(encodedSnapshotPairs),
          tSize: Buffer.byteLength(encodedTxPairs),
          network,
          service,
          domain,
          key: Buffer.from(publicKey).toString("base64"),
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
        txs: encodedTxPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with public keys and no transaction", async () => {
    const previousEnd = deps.dateString();
    const updated = deps.dateString();
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root, updated });

    const aggregate = {
      headers: {
        snapshotHash,
        lastEventNumber: aggregateLastEventNumber,
      },
      events: [event],
      context: aggregateContext,
      state: aggregateState,
      groups: aggregateGroups,
      txIds,
    };
    const aggregateFnFake = fake.returns(aggregate);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const cononicalStringFake = stub()
      .onCall(0)
      .returns(eventPayloadCononicalString)
      .onCall(1)
      .returns(eventCononicalString)
      .onCall(2)
      .returns(snapshotStateCononicalString)
      .onCall(3)
      .returns(snapshotCononicalString)
      .onCall(4)
      .returns(txEventsCononicalString);

    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot)
      .onCall(3)
      .returns(txsMerkleRoot);

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
        create: () => groupsHash,
      })
      .onCall(3)
      .returns({
        create: () => stateHash,
      })
      .onCall(4)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(5)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(6)
      .returns({
        create: () => txIdHash,
      })
      .onCall(7)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

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
      .returns(encodedSnapshotPairs)
      .onCall(3)
      .returns(encodedTxPairs);
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
      findOneSnapshotFn,
      eventStreamFn,
      blockLimit,
      handlers,
      isPublic: false,
    })();

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 10,
      reverse: true,
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
    expect(hashFake.getCall(2)).to.have.been.calledWith(aggregateGroups);
    expect(hashFake.getCall(3)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(4)).to.have.been.calledWith({
      nonce: `${root}_0`,
      number: 0,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      gHash: groupsHash,
      pHash: snapshotHash,
      created: deps.dateString(),
      root,
      isPublic: false,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 1,
      eRoot: eventsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedEventPairs),
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: `${root}_0`,
          number: 0,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          gHash: groupsHash,
          pHash: snapshotHash,
          created: deps.dateString(),
          root,
          isPublic: false,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 1,
          eRoot: eventsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedEventPairs),
        },
        context: aggregateContext,
        state: aggregateState,
        groups: aggregateGroups,
        events: encodedEventPairs,
        txIds,
      },
    });
    expect(hashFake.getCall(5)).to.have.been.calledWith(savedSnapshotRoot);
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
    expect(merkleRootFake.getCall(3)).to.have.been.calledWith([
      [txIdHash, txEventsCononicalString],
    ]);
    expect(hashFake.getCall(6)).to.have.been.calledWith(txId);
    expect(cononicalStringFake.getCall(4)).to.have.been.calledWith([eventHash]);
    expect(hashFake.getCall(7)).to.have.been.calledWith({
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 1,
      sCount: 1,
      tCount: 1,
      eRoot: allEventsMerkleRoot.toString("base64"),
      sRoot: snapshotMerkleRoot.toString("base64"),
      tRoot: txsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedAllEventPairs),
      sSize: Buffer.byteLength(encodedSnapshotPairs),
      tSize: Buffer.byteLength(encodedTxPairs),
      network,
      service,
      domain,
      key: Buffer.from(publicKey).toString("base64"),
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 1,
          sCount: 1,
          tCount: 1,
          eRoot: allEventsMerkleRoot.toString("base64"),
          sRoot: snapshotMerkleRoot.toString("base64"),
          tRoot: txsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedAllEventPairs),
          sSize: Buffer.byteLength(encodedSnapshotPairs),
          tSize: Buffer.byteLength(encodedTxPairs),
          network,
          service,
          domain,
          key: Buffer.from(publicKey).toString("base64"),
        },
        events: encodedAllEventPairs,
        txs: encodedTxPairs,
        snapshots: encodedSnapshotPairs,
      },
    });
  });
  it("should call with the correct params and no events", async () => {
    const date = new Date(deps.dateString());
    date.setMinutes(date.getMinutes() - 3);
    const updated = deps.dateString();
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: date.toISOString(),
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root, updated });

    const aggregate = {
      headers: {
        snapshotHash,
        lastEventNumber: aggregateLastEventNumber,
      },
      events: [],
      context: aggregateContext,
      groups: aggregateGroups,
      state: aggregateState,
      txIds,
    };
    const aggregateFnFake = fake.returns(aggregate);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const cononicalStringFake = fake();
    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(snapshotMerkleRoot)
      .onCall(1)
      .returns(allEventsMerkleRoot)
      .onCall(2)
      .returns(txsMerkleRoot);

    replace(deps, "merkleRoot", merkleRootFake);

    const hashFake = fake.returns({
      create: () => blockHeadersHash,
    });

    replace(deps, "hash", hashFake);

    const saveSnapshotFnFake = fake();

    const saveBlockFnFake = fake();
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodeFake = stub()
      .onCall(0)
      .returns(encodedAllEventPairs)
      .onCall(1)
      .returns(encodedSnapshotPairs)
      .onCall(2)
      .returns(encodedTxPairs);

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
      findOneSnapshotFn,
      eventStreamFn,
      blockLimit,
      handlers,
      isPublic,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: date.toISOString(),
      updatedBefore: deps.dateString(),
      parallel: 10,
      reverse: true,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake).to.not.have.been.called;
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([]);
    expect(merkleRootFake.getCall(1)).to.have.been.calledWith([]);
    expect(merkleRootFake.getCall(2)).to.have.been.calledWith([]);
    expect(hashFake).to.have.been.calledOnceWith({
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: date.toISOString(),
      end: deps.dateString(),
      eCount: 0,
      sCount: 0,
      tCount: 0,
      eRoot: allEventsMerkleRoot.toString("base64"),
      sRoot: snapshotMerkleRoot.toString("base64"),
      tRoot: txsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedAllEventPairs),
      sSize: Buffer.byteLength(encodedSnapshotPairs),
      tSize: Buffer.byteLength(encodedTxPairs),
      network,
      service,
      domain,
      key: Buffer.from(publicKey).toString("base64"),
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: date.toISOString(),
          end: deps.dateString(),
          eCount: 0,
          sCount: 0,
          tCount: 0,
          eRoot: allEventsMerkleRoot.toString("base64"),
          sRoot: snapshotMerkleRoot.toString("base64"),
          tRoot: txsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedAllEventPairs),
          sSize: Buffer.byteLength(encodedSnapshotPairs),
          tSize: Buffer.byteLength(encodedTxPairs),
          network,
          service,
          domain,
          key: Buffer.from(publicKey).toString("base64"),
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
        txs: encodedTxPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with no previous snapshot", async () => {
    const previousEnd = deps.dateString();
    const updated = deps.dateString();
    const latestBlock = {
      hash: previousHash,
      headers: {
        end: previousEnd,
        number: previousNumber,
      },
    };
    const latestBlockFnFake = fake.returns(latestBlock);

    const rootStreamFnFake = stub().yieldsTo("fn", { root, updated });

    const aggregate = {
      headers: {
        lastEventNumber: aggregateLastEventNumber,
        number: aggregateLastNumber,
      },
      events: [event],
      context: aggregateContext,
      state: aggregateState,
      groups: aggregateGroups,
      txIds,
    };
    const aggregateFnFake = fake.returns(aggregate);
    const aggregateOuterFnFake = fake.returns(aggregateFnFake);
    replace(deps, "aggregate", aggregateOuterFnFake);

    const cononicalStringFake = stub()
      .onFirstCall()
      .returns(eventCononicalString)
      .onSecondCall()
      .returns(snapshotCononicalString)
      .onCall(2)
      .returns(txEventsCononicalString);

    replace(deps, "cononicalString", cononicalStringFake);

    const merkleRootFake = stub()
      .onCall(0)
      .returns(eventsMerkleRoot)
      .onCall(1)
      .returns(snapshotMerkleRoot)
      .onCall(2)
      .returns(allEventsMerkleRoot)
      .onCall(3)
      .returns(txsMerkleRoot);

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
        create: () => groupsHash,
      })
      .onCall(3)
      .returns({
        create: () => stateHash,
      })
      .onCall(4)
      .returns({
        create: () => previousHash,
      })
      .onCall(5)
      .returns({
        create: () => snapshotHeadersHash,
      })
      .onCall(6)
      .returns({
        create: () => snapshotRootHash,
      })
      .onCall(7)
      .returns({
        create: () => txIdHash,
      })
      .onCall(8)
      .returns({
        create: () => blockHeadersHash,
      });

    replace(deps, "hash", hashFake);

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
      .returns(encodedSnapshotPairs)
      .onCall(3)
      .returns(encodedTxPairs);

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
      findOneSnapshotFn,
      eventStreamFn,
      blockLimit,
      handlers,
      isPublic,
    })(transaction);

    expect(latestBlockFnFake).to.have.been.calledOnceWith();
    expect(rootStreamFnFake).to.have.been.calledOnceWith({
      updatedOnOrAfter: previousEnd,
      updatedBefore: deps.dateString(),
      parallel: 10,
      reverse: true,
      fn: match(() => true),
    });
    expect(aggregateFnFake.getCall(0)).to.have.been.calledWith(root, {
      includeEvents: true,
    });

    expect(cononicalStringFake.getCall(0)).to.have.been.calledWith(event);

    expect(hashFake.getCall(0)).to.have.been.calledWith(eventHash);
    expect(hashFake.getCall(1)).to.have.been.calledWith(aggregateContext);
    expect(hashFake.getCall(2)).to.have.been.calledWith(aggregateGroups);
    expect(hashFake.getCall(3)).to.have.been.calledWith(aggregateState);
    expect(hashFake.getCall(4)).to.have.been.calledWith("~");
    expect(hashFake.getCall(5)).to.have.been.calledWith({
      nonce: `${root}_${aggregateLastNumber + 1}`,
      number: aggregateLastNumber + 1,
      block: previousNumber + 1,
      cHash: contextHash,
      sHash: stateHash,
      gHash: groupsHash,
      pHash: previousHash,
      created: deps.dateString(),
      root,
      isPublic,
      domain,
      service,
      network,
      lastEventNumber: aggregateLastEventNumber,
      eCount: 1,
      eRoot: eventsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedEventPairs),
    });
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([
      [eventKeyHash, eventCononicalString],
    ]);
    expect(saveSnapshotFnFake).to.have.been.calledOnceWith({
      snapshot: {
        hash: snapshotHeadersHash,
        headers: {
          nonce: `${root}_${aggregateLastNumber + 1}`,
          number: aggregateLastNumber + 1,
          block: previousNumber + 1,
          cHash: contextHash,
          sHash: stateHash,
          gHash: groupsHash,
          pHash: previousHash,
          created: deps.dateString(),
          root,
          isPublic,
          domain,
          service,
          network,
          lastEventNumber: aggregateLastEventNumber,
          eCount: 1,
          eRoot: eventsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedEventPairs),
        },
        context: aggregateContext,
        state: aggregateState,
        events: encodedEventPairs,
        groups: aggregateGroups,
        txIds,
      },
      transaction,
    });
    expect(hashFake.getCall(6)).to.have.been.calledWith(savedSnapshotRoot);
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
    expect(merkleRootFake.getCall(3)).to.have.been.calledWith([
      [txIdHash, txEventsCononicalString],
    ]);
    expect(hashFake.getCall(7)).to.have.been.calledWith(txId);
    expect(cononicalStringFake.getCall(2)).to.have.been.calledWith([eventHash]);
    expect(hashFake.getCall(8)).to.have.been.calledWith({
      pHash: previousHash,
      created: deps.dateString(),
      number: previousNumber + 1,
      start: previousEnd,
      end: deps.dateString(),
      eCount: 1,
      sCount: 1,
      tCount: 1,
      eRoot: allEventsMerkleRoot.toString("base64"),
      sRoot: snapshotMerkleRoot.toString("base64"),
      tRoot: txsMerkleRoot.toString("base64"),
      eSize: Buffer.byteLength(encodedAllEventPairs),
      sSize: Buffer.byteLength(encodedSnapshotPairs),
      tSize: Buffer.byteLength(encodedTxPairs),
      network,
      service,
      domain,
      key: Buffer.from(publicKey).toString("base64"),
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          pHash: previousHash,
          created: deps.dateString(),
          number: previousNumber + 1,
          start: previousEnd,
          end: deps.dateString(),
          eCount: 1,
          sCount: 1,
          tCount: 1,
          eRoot: allEventsMerkleRoot.toString("base64"),
          sRoot: snapshotMerkleRoot.toString("base64"),
          tRoot: txsMerkleRoot.toString("base64"),
          eSize: Buffer.byteLength(encodedAllEventPairs),
          sSize: Buffer.byteLength(encodedSnapshotPairs),
          tSize: Buffer.byteLength(encodedTxPairs),
          network,
          service,
          domain,
          key: Buffer.from(publicKey).toString("base64"),
        },
        events: encodedAllEventPairs,
        snapshots: encodedSnapshotPairs,
        txs: encodedTxPairs,
      },
      transaction,
    });
  });
  it("should call with the correct params with no previous block", async () => {
    const latestBlockFnFake = fake.returns();
    const updated = deps.dateString();

    const rootStreamFnFake = stub().yieldsTo("fn", { root, updated });

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

    const genesisBlock = "some-genesis-bock";
    const saveBlockFnFake = fake.returns(genesisBlock);
    const encryptFnFake = fake();

    const signFnFake = fake.returns(signedBlockHeaderHash);

    const encodedEmptyPairs = "some-encoded-empty-pairs";
    const encodeFake = fake.returns(encodedEmptyPairs);
    replace(deps, "encode", encodeFake);

    const blockPublisherPublicKeyFnFake = fake.returns(publicKey);
    const result = await create({
      rootStreamFn: rootStreamFnFake,
      latestBlockFn: latestBlockFnFake,
      saveBlockFn: saveBlockFnFake,
      encryptFn: encryptFnFake,
      signFn: signFnFake,
      blockPublisherPublicKeyFn: blockPublisherPublicKeyFnFake,
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
      isPublic,
    })(transaction);

    expect(result).to.deep.equal({ block: genesisBlock, full: false });
    expect(latestBlockFnFake).to.have.been.calledOnceWith();

    expect(hashFake.getCall(0)).to.have.been.calledWith("~");
    expect(merkleRootFake.getCall(0)).to.have.been.calledWith([]);
    expect(hashFake.getCall(1)).to.have.been.calledWith({
      pHash: genesisPreviousHash,
      created: deps.dateString(),
      number: 0,
      start: "2020-01-01T05:00:00.000Z",
      end: "2020-01-01T05:00:00.001Z",
      eCount: 0,
      sCount: 0,
      tCount: 0,
      eRoot: emptyMerkleRoot,
      sRoot: emptyMerkleRoot,
      tRoot: emptyMerkleRoot,
      eSize: Buffer.byteLength(encodedEmptyPairs),
      sSize: Buffer.byteLength(encodedEmptyPairs),
      tSize: Buffer.byteLength(encodedEmptyPairs),
      network,
      service,
      domain,
      key: Buffer.from(publicKey).toString("base64"),
    });
    expect(signFnFake).to.have.been.calledOnceWith(blockHeadersHash);

    expect(saveBlockFnFake).to.have.been.calledOnceWith({
      block: {
        signature: signedBlockHeaderHash,
        hash: blockHeadersHash,
        headers: {
          pHash: genesisPreviousHash,
          created: deps.dateString(),
          number: 0,
          start: "2020-01-01T05:00:00.000Z",
          end: "2020-01-01T05:00:00.001Z",
          eCount: 0,
          sCount: 0,
          tCount: 0,
          eRoot: emptyMerkleRoot,
          sRoot: emptyMerkleRoot,
          tRoot: emptyMerkleRoot,
          eSize: Buffer.byteLength(encodedEmptyPairs),
          sSize: Buffer.byteLength(encodedEmptyPairs),
          tSize: Buffer.byteLength(encodedEmptyPairs),
          network,
          service,
          domain,
          key: Buffer.from(publicKey).toString("base64"),
        },
        events: encodedEmptyPairs,
        snapshots: encodedEmptyPairs,
        txs: encodedEmptyPairs,
      },
      transaction,
    });
  });
});
