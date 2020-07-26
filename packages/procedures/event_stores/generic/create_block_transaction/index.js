const deps = require("./deps");

module.exports = ({
  saveSnapshotFn,
  aggregateFn,
  rootStreamFn,
  latestBlockFn,
  saveBlockFn,
  encryptFn,
  signFn,
  blockPublisherPublicKeyFn,
  public,
}) => async (transaction) => {
  const previousBlock = await latestBlockFn();

  const genesisPrevious = "~";

  if (!previousBlock) {
    const emptyMerkleRoot = await deps.merkleRoot([]);

    const blockHeaders = {
      nonce: deps.nonce(),
      pHash: deps.hash(genesisPrevious).create(),
      created: deps.dateString(),
      number: 0,
      start: "2020-01-01T05:00:00.000+00:00",
      end: deps.dateString(),
      eCount: 0,
      sCount: 0,
      eRoot: emptyMerkleRoot,
      sRoot: emptyMerkleRoot,
      network: process.env.NETWORK,
      service: process.env.SERVICE,
      domain: process.env.DOMAIN,
      key: await blockPublisherPublicKeyFn(),
    };

    const blockHeadersHash = deps.hash(blockHeaders).create();
    const signedBlockHeadersHash = await signFn(blockHeadersHash);

    const genesisBlock = {
      signature: signedBlockHeadersHash,
      hash: blockHeadersHash,
      headers: blockHeaders,
      events: deps.encode([]),
      snapshots: deps.encode([]),
    };

    const savedGenesisBlock = await saveBlockFn({
      block: genesisBlock,
      ...(transaction && { transaction }),
    });

    return savedGenesisBlock;
  }

  const snapshots = [];
  const allStringifiedEventPairs = [];

  const boundary = deps.dateString();

  const nextBlockNumber = previousBlock.headers.number + 1;

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
        })
      );

      allStringifiedEventPairs.push(...stringifiedEventPairs);

      const eventsMerkleRoot = await deps.merkleRoot(stringifiedEventPairs);

      const contextHash = deps.hash(aggregate.context).create();
      const stateHash = deps.hash(aggregate.state).create();

      const previousHash = aggregate.headers.snapshotHash || genesisPrevious;

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
        trace: aggregate.headers.trace,
        eCount: stringifiedEventPairs.length,
        eRoot: eventsMerkleRoot,
      };

      const snapshotHeadersHash = deps.hash(snapshotHeaders).create();

      const normalizedSnapshot = {
        hash: snapshotHeadersHash,
        headers: snapshotHeaders,
        context: aggregate.context,
        state: aggregate.state,
        events: deps.encode(stringifiedEventPairs),
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

  const [snapshotsMerkleRoot, allEventsMerkleRoot] = await Promise.all([
    deps.merkleRoot(stringifiedSnapshotPairs),
    deps.merkleRoot(allStringifiedEventPairs),
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
    eRoot: allEventsMerkleRoot,
    sRoot: snapshotsMerkleRoot,
    network: process.env.NETWORK,
    service: process.env.SERVICE,
    domain: process.env.DOMAIN,
    key: await blockPublisherPublicKeyFn(),
  };

  const blockHeadersHash = deps.hash(blockHeaders).create();
  const signedBlockHeadersHash = await signFn(blockHeadersHash);

  const normalizedBlock = {
    signature: signedBlockHeadersHash,
    hash: blockHeadersHash,
    headers: blockHeaders,
    events: deps.encode(allStringifiedEventPairs),
    snapshots: deps.encode(stringifiedSnapshotPairs),
  };

  const block = await saveBlockFn({
    block: normalizedBlock,
    ...(transaction && { transaction }),
  });

  return block;
};
