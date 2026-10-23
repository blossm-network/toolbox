// The destination owns limits and the durable fence. Nothing mutates a view until
// the complete read/transform phase has produced a bounded atomic batch.
export default ({ request, pushFn }) =>
  async ({ playId, run }) => {
    const { body: lease } = await request({ action: "begin", playId });
    const notify = async ({ generation, results = [] }) => {
      const sent = new Set();
      for (const { type, result } of results) {
        if (type !== "put" || !result.view || sent.has(result.view.headers.id))
          continue;
        sent.add(result.view.headers.id);
        const { body: current } = await request({
          action: "notification",
          generation,
          id: result.view.headers.id,
        });
        if (current.view) await pushFn(current);
      }
    };
    if (lease.complete) return notify(lease);

    const operations = [];
    let running = true;
    const session = {
      add: (operation) => {
        if (!running) throw new Error("Projection session has stopped.");
        const candidate = [...operations, operation];
        if (
          candidate.length > lease.limits.maxOperations ||
          Buffer.byteLength(JSON.stringify(candidate)) > lease.limits.maxBytes
        )
          throw new Error("Projection batch exceeds the destination limits.");
        operations.push(operation);
      },
    };
    let pending = Promise.resolve();
    let renewalError;
    let deadline;
    const expired = new Promise((_, reject) => {
      deadline = setTimeout(
        () => reject(new Error("Projection transform exceeded its deadline.")),
        lease.limits.maxPlayMilliseconds
      );
    });
    const timer = setInterval(() => {
      pending = pending
        .then(async () => {
          if (running && !renewalError)
            await request({ action: "renew", ...lease });
        })
        .catch((error) => {
          renewalError = error;
        });
    }, Math.floor(lease.limits.leaseMilliseconds / 3));
    const stop = async () => {
      running = false;
      clearTimeout(deadline);
      clearInterval(timer);
      await pending;
    };
    try {
      await Promise.race([run(session), expired]);
      await stop();
      if (renewalError) throw renewalError;
      const { body: receipt } = await request({
        action: "commit",
        playId,
        owner: lease.owner,
        generation: lease.generation,
        operations,
      });
      await notify(receipt);
    } finally {
      await stop();
      try {
        await request({
          action: "release",
          owner: lease.owner,
          generation: lease.generation,
        });
      } catch {
        // A lost release only delays the next play until lease expiry. Never turn
        // an acknowledged commit into a request to repeat incremental mutations.
      }
    }
  };
