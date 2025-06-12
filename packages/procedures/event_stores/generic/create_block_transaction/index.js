const deps = require("./deps");

//TODO store the merkle proofs elsewhere for O(log(n)) verification. Not important now.
module.exports = ({
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
  blockLimit,
}) => async (transaction) => {
  const previousBlock = await latestBlockFn();

  const genesisPrevious = "~";

  if (!previousBlock) {
    const emptyMerkleRoot = await (await deps.merkleRoot([])).toString(
      "base64"
    );

    const emptyEncoding = deps.encode([]);
    const emptyByteLength = Buffer.byteLength(emptyEncoding);

    const blockHeaders = {
      pHash: deps.hash(genesisPrevious).create(),
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
      eSize: emptyByteLength,
      sSize: emptyByteLength,
      tSize: emptyByteLength,
      network: process.env.NETWORK,
      service: process.env.SERVICE,
      domain: process.env.DOMAIN,
      key: Buffer.from(await blockPublisherPublicKeyFn()).toString("base64"),
    };

    const blockHeadersHash = deps.hash(blockHeaders).create();
    const signedBlockHeadersHash = await signFn(blockHeadersHash);

    const genesisBlock = {
      signature: signedBlockHeadersHash,
      hash: blockHeadersHash,
      headers: blockHeaders,
      events: emptyEncoding,
      snapshots: emptyEncoding,
      txs: emptyEncoding,
    };

    const savedGenesisBlock = await saveBlockFn({
      block: genesisBlock,
      ...(transaction && { transaction }),
    });

    return { block: savedGenesisBlock, full: false };
  }

  const snapshots = [];
  const allStringifiedEventPairs = [];
  const txs = {};

  const nextBlockNumber = previousBlock.headers.number + 1;

  const aggregateFn = deps.aggregate({
    findOneSnapshotFn,
    eventStreamFn,
    handlers,
  });

  let lastRootEnd;
  let end = deps.dateString();

  let count;
  let full = false;

  const increment = Math.round(blockLimit * 0.1);

  await rootStreamFn({
    updatedOnOrAfter: previousBlock.headers.end,
    updatedBefore: end,
    reverse: true,
    fn: async ({ root, updated }) => {
      if (count >= blockLimit - increment) {
        full = true;
        return;
      }

      const aggregate = await aggregateFn(root, { includeEvents: true });

      if (aggregate.events.length == 0) return;

      count++;

      const stringifiedEventPairs = [];
      await Promise.all(
        aggregate.events.map(async (e) => {
          stringifiedEventPairs.push([
            deps.hash(e.hash).create(),
            deps.cononicalString(
              isPublic
                ? e
                : {
                    ...e,
                    payload: await encryptFn(deps.cononicalString(e.payload)),
                  }
            ),
          ]);
          if (!txs[e.tx.id]) txs[e.tx.id] = [];
          txs[e.tx.id].push(e.hash);
        })
      );

      allStringifiedEventPairs.push(...stringifiedEventPairs);

      const eventsMerkleRoot = await deps.merkleRoot(stringifiedEventPairs);

      const contextHash = deps.hash(aggregate.context).create();
      const groupsHash = deps.hash(aggregate.groups).create();
      const stateHash = deps.hash(aggregate.state).create();

      const previousHash =
        aggregate.headers.snapshotHash || deps.hash(genesisPrevious).create();

      const encodedEvents = deps.encode(stringifiedEventPairs);

      //TODO this is a crutch so i dont have to delete all dbs rn.
      // in the future get rid of the first case.
      const nextSnapshotNumber = aggregate.headers.nonce
        ? aggregate.headers.nonce.split("_")[1] + 1
        : aggregate.headers.number == undefined
        ? 0
        : aggregate.headers.number + 1;

      const snapshotHeaders = {
        nonce: `${root}_${nextSnapshotNumber}`,
        block: nextBlockNumber,
        cHash: contextHash,
        gHash: groupsHash,
        sHash: stateHash,
        pHash: previousHash,
        created: deps.dateString(),
        number: nextSnapshotNumber,
        root,
        isPublic,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        lastEventNumber: aggregate.headers.lastEventNumber,
        eCount: stringifiedEventPairs.length,
        eRoot: eventsMerkleRoot.toString("base64"),
        eSize: Buffer.byteLength(encodedEvents),
      };

      const snapshotHeadersHash = deps.hash(snapshotHeaders).create();

      const normalizedSnapshot = {
        hash: snapshotHeadersHash,
        headers: snapshotHeaders,
        context: aggregate.context,
        groups: aggregate.groups,
        state: aggregate.state,
        events: encodedEvents,
        txIds: aggregate.txIds,
      };

      const snapshot = await saveSnapshotFn({
        snapshot: normalizedSnapshot,
        ...(transaction && { transaction }),
      });

      snapshots.push({
        hash: snapshot.hash,
        headers: snapshot.headers,
        context: snapshot.context,
        state: snapshot.state,
      });

      lastRootEnd =
        lastRootEnd == undefined || updated > lastRootEnd
          ? updated
          : lastRootEnd;
    },
    parallel: increment,
  });

  const stringifiedSnapshotPairs = [];
  await Promise.all(
    snapshots.map(async (s) => {
      stringifiedSnapshotPairs.push([
        //The root is the key so that we can ask "does this block contain a state change for this root?".
        deps.hash(s.headers.root).create(),
        deps.cononicalString(
          isPublic
            ? s
            : {
                ...s,
                state: await encryptFn(deps.cononicalString(s.state)),
              }
        ),
      ]);
    })
  );

  const stringifiedTxPairs = [];
  for (const key in txs) {
    stringifiedTxPairs.push([
      deps.hash(key).create(),
      deps.cononicalString(txs[key]),
    ]);
  }

  const [
    snapshotsMerkleRoot,
    allEventsMerkleRoot,
    txsMerkleRoot,
  ] = await Promise.all([
    deps.merkleRoot(stringifiedSnapshotPairs),
    deps.merkleRoot(allStringifiedEventPairs),
    deps.merkleRoot(stringifiedTxPairs),
  ]);

  const encodedAllEvents = deps.encode(allStringifiedEventPairs);
  const encodedSnapshots = deps.encode(stringifiedSnapshotPairs);
  const encodedTxs = deps.encode(stringifiedTxPairs);

  const sCount = stringifiedSnapshotPairs.length;

  const blockHeaders = {
    pHash: previousBlock.hash,
    created: deps.dateString(),
    number: previousBlock.headers.number + 1,
    start: previousBlock.headers.end,
    end: lastRootEnd || end,
    eCount: allStringifiedEventPairs.length,
    sCount,
    tCount: stringifiedTxPairs.length,
    eRoot: allEventsMerkleRoot.toString("base64"),
    sRoot: snapshotsMerkleRoot.toString("base64"),
    tRoot: txsMerkleRoot.toString("base64"),
    eSize: Buffer.byteLength(encodedAllEvents),
    sSize: Buffer.byteLength(encodedSnapshots),
    tSize: Buffer.byteLength(encodedTxs),
    network: process.env.NETWORK,
    service: process.env.SERVICE,
    domain: process.env.DOMAIN,
    key: Buffer.from(await blockPublisherPublicKeyFn()).toString("base64"),
  };

  const blockHeadersHash = deps.hash(blockHeaders).create();
  const signedBlockHeadersHash = await signFn(blockHeadersHash);

  const normalizedBlock = {
    signature: signedBlockHeadersHash,
    hash: blockHeadersHash,
    headers: blockHeaders,
    events: encodedAllEvents,
    snapshots: encodedSnapshots,
    txs: encodedTxs,
  };

  const block = await saveBlockFn({
    block: normalizedBlock,
    ...(transaction && { transaction }),
  });

  return { block, full };
};
