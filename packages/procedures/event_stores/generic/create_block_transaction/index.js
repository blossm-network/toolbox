const deps = require("./deps");

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
  public,
}) => async (transaction) => {
  const previousBlock = await latestBlockFn();

  const genesisPrevious = "~";

  if (!previousBlock) {
    const emptyMerkleRoot = await (await deps.merkleRoot([])).toString(
      "base64"
    );

    const blockHeaders = {
      nonce: deps.nonce(),
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
      events: deps.encode([]),
      snapshots: deps.encode([]),
      txs: deps.encode([]),
    };

    const savedGenesisBlock = await saveBlockFn({
      block: genesisBlock,
      ...(transaction && { transaction }),
    });

    return savedGenesisBlock;
  }

  const snapshots = [];
  const allStringifiedEventPairs = [];
  const txs = {};

  const boundary = deps.dateString();

  const nextBlockNumber = previousBlock.headers.number + 1;

  const aggregateFn = deps.aggregate({
    findOneSnapshotFn,
    eventStreamFn,
    handlers,
  });

  await rootStreamFn({
    updatedOnOrAfter: previousBlock.headers.end,
    updatedBefore: boundary,
    fn: async ({ root }) => {
      const aggregate = await aggregateFn(root, { includeEvents: true });

      if (aggregate.events.length == 0) return;

      const stringifiedEventPairs = [];
      await Promise.all(
        aggregate.events.map(async (e) => {
          stringifiedEventPairs.push([
            deps.hash(e.hash).create(),
            deps.cononicalString(
              public
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
      const stateHash = deps.hash(aggregate.state).create();

      const previousHash =
        aggregate.headers.snapshotHash || deps.hash(genesisPrevious).create();

      const snapshotHeaders = {
        nonce: deps.nonce(),
        block: nextBlockNumber,
        cHash: contextHash,
        sHash: stateHash,
        pHash: previousHash,
        created: deps.dateString(),
        root,
        public,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        lastEventNumber: aggregate.headers.lastEventNumber,
        eCount: stringifiedEventPairs.length,
        eRoot: eventsMerkleRoot.toString("base64"),
      };

      const snapshotHeadersHash = deps.hash(snapshotHeaders).create();

      const normalizedSnapshot = {
        hash: snapshotHeadersHash,
        headers: snapshotHeaders,
        context: aggregate.context,
        state: aggregate.state,
        events: deps.encode(stringifiedEventPairs),
        txIds: aggregate.txIds,
      };

      console.log({ normalizedSnapshot });
      const snapshot = await saveSnapshotFn({
        snapshot: normalizedSnapshot,
        ...(transaction && { transaction }),
      });

      console.log({ snapshot });
      snapshots.push({
        hash: snapshot.hash,
        headers: snapshot.headers,
        context: snapshot.context,
        state: snapshot.state,
      });
    },
    parallel: 100,
  });

  const stringifiedSnapshotPairs = [];
  await Promise.all(
    snapshots.map(async (s) => {
      stringifiedSnapshotPairs.push([
        //The root is the key so that we can ask "does this block contain a state change for this root?".
        deps.hash(s.headers.root).create(),
        deps.cononicalString(
          public
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

  const blockHeaders = {
    nonce: deps.nonce(),
    pHash: previousBlock.hash,
    created: deps.dateString(),
    number: previousBlock.headers.number + 1,
    start: previousBlock.headers.end,
    end: boundary,
    eCount: allStringifiedEventPairs.length,
    sCount: stringifiedSnapshotPairs.length,
    tCount: stringifiedTxPairs.length,
    eRoot: allEventsMerkleRoot.toString("base64"),
    sRoot: snapshotsMerkleRoot.toString("base64"),
    tRoot: txsMerkleRoot.toString("base64"),
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
    events: deps.encode(allStringifiedEventPairs),
    snapshots: deps.encode(stringifiedSnapshotPairs),
    txs: deps.encode(stringifiedTxPairs),
  };

  const block = await saveBlockFn({
    block: normalizedBlock,
    ...(transaction && { transaction }),
  });

  return block;
};
