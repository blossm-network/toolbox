import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import server from "../index.js";
import deps from "../deps.js";

// Real server -> post -> post_transaction composition; only HTTP is replaced.
describe("Optional payload normalization", () => {
  let nodeEnv;
  let postRoute;
  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    replace(deps, "server", () => ({
      get() {
        return this;
      },
      post(handler, options) {
        if (!options) postRoute = handler;
        return this;
      },
      listen() {},
    }));
  });
  afterEach(() => {
    restore();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  });

  const submit = async (options, payload = { amount: "2" }) => {
    const saveEventsFn = fake.resolves();
    await server({
      normalizeTransactionFn: (tx) => tx,
      saveEventsFn,
      reserveRootCountsFn: async ({ root }) => ({ root, value: 1 }),
      createTransactionFn: (fn) => fn(),
      idempotencyConflictCheckFn: async () => false,
      handlers: {},
      ...options,
    });
    await postRoute(
      {
        body: {
          eventData: [
            {
              event: {
                headers: {
                  root: "root",
                  domain: process.env.DOMAIN,
                  service: process.env.SERVICE,
                  network: process.env.NETWORK,
                },
                payload,
              },
            },
          ],
        },
      },
      { sendStatus() {} },
    );
    return saveEventsFn.firstCall.args[0].events[0];
  };

  it("hashes and persists the adapter's normalized payload", async () => {
    const raw = await submit();
    const cast = await submit({
      normalizePayloadFn: async ({ amount }) => ({ amount: Number(amount) }),
    });
    assert.deepEqual(cast.payload, { amount: 2 });
    // Its commitment is that of the normalized value, not of the submission.
    assert.equal(
      cast.headers.pHash,
      (await submit(undefined, { amount: 2 })).headers.pHash,
    );
    assert.notEqual(cast.headers.pHash, raw.headers.pHash);
  });

  it("keeps the submitted payload for adapters without a normalizer", async () => {
    assert.deepEqual((await submit()).payload, { amount: "2" });
  });
});
