import assert from "node:assert/strict";
import { fake } from "sinon";
import post from "../index.js";

const event = { action: "answer", root: "challenge", correctNumber: 1 };
const request = { body: { payload: {}, headers: {} } };
const fixture = (result, addFn = fake.resolves()) => {
  const res = {
    set: fake(() => res),
    status: fake(() => res),
    send: fake(),
    sendStatus: fake(),
  };
  const handler = post({
    mainFn: typeof result === "function" ? result : fake.resolves(result),
    aggregateFn: () => fake(),
    commandFn: () => fake(),
    queryAggregatesFn: () => fake(),
    readFactFn: () => fake(),
    streamFactFn: () => fake(),
    countFn: () => fake(),
    addFn,
  });
  return { run: () => handler(request, res), res, addFn };
};

describe("Explicit thenFn results", () => {
  it("accepts a response returned only by the callback", async () => {
    const f = fixture({ thenFn: fake.resolves({ response: { ready: true } }) });
    await f.run();
    assert.equal(f.res.status.firstCall.args[0], 200);
    assert.deepEqual(f.res.send.firstCall.args[0], { ready: true });
  });

  it("shallow-merges response and headers with callback keys taking precedence", async () => {
    const response = {
      original: true,
      nested: { old: true },
      conflict: "main",
    };
    const headers = { "x-original": "yes", "x-conflict": "main" };
    const f = fixture({
      response,
      headers,
      statusCode: 201,
      thenFn: fake.resolves({
        response: {
          added: false,
          count: 0,
          nested: { fresh: true },
          conflict: "then",
        },
        headers: { "x-added": "yes", "x-conflict": "then" },
        statusCode: 207,
      }),
    });
    await f.run();
    assert.deepEqual(f.res.send.firstCall.args[0], {
      original: true,
      added: false,
      count: 0,
      nested: { fresh: true },
      conflict: "then",
    });
    assert.deepEqual(f.res.set.firstCall.args[0], {
      "x-original": "yes",
      "x-added": "yes",
      "x-conflict": "then",
    });
    assert.equal(f.res.status.firstCall.args[0], 207);
    assert.deepEqual(response, {
      original: true,
      nested: { old: true },
      conflict: "main",
    });
    assert.deepEqual(headers, { "x-original": "yes", "x-conflict": "main" });
  });

  it("appends tokens and revocations after the main arrays", async () => {
    const tokens = [{ type: "access", value: "main-token" }];
    const revoke = [{ type: "challenge", network: "main.network" }];
    const extraToken = { type: "access", value: "then-token" };
    const extraRevoke = { type: "challenge", network: "then.network" };
    const f = fixture({
      tokens,
      revoke,
      thenFn: fake.resolves({ tokens: [extraToken], revoke: [extraRevoke] }),
    });
    await f.run();
    assert.deepEqual(f.res.send.firstCall.args[0], {
      _tokens: [...tokens, extraToken],
      _revoke: [...revoke, extraRevoke],
    });
    assert.deepEqual(tokens, [{ type: "access", value: "main-token" }]);
    assert.deepEqual(revoke, [{ type: "challenge", network: "main.network" }]);
  });

  for (const field of ["tokens", "revoke"]) {
    it(`accepts ${field} when main supplied none`, async () => {
      const values = [{ type: "access", network: "some.network" }];
      const f = fixture({ thenFn: fake.resolves({ [field]: values }) });
      await f.run();
      assert.equal(f.res.status.firstCall.args[0], 200);
      assert.deepEqual(f.res.send.firstCall.args[0][`_${field}`], values);
    });
  }

  it("honors a callback status when there is no response body", async () => {
    const f = fixture({
      statusCode: 201,
      thenFn: fake.resolves({ statusCode: 202 }),
    });
    await f.run();
    assert.equal(f.res.sendStatus.firstCall.args[0], 202);
  });

  it("honors main's status-only result too", async () => {
    const f = fixture({ statusCode: 202 });
    await f.run();
    assert.equal(f.res.sendStatus.firstCall.args[0], 202);
  });

  for (const result of [undefined, null]) {
    it(`keeps the default empty response for a callback returning ${result}`, async () => {
      const f = fixture({ thenFn: fake.resolves(result) });
      await f.run();
      assert.equal(f.res.sendStatus.firstCall.args[0], 204);
    });
  }

  it("preserves main fields when callback fields are omitted or null", async () => {
    const f = fixture({
      response: { kept: true },
      headers: { "x-kept": "yes" },
      statusCode: 201,
      tokens: [],
      revoke: [],
      thenFn: fake.resolves({
        response: null,
        headers: null,
        tokens: null,
        revoke: null,
        statusCode: null,
      }),
    });
    await f.run();
    assert.equal(f.res.status.firstCall.args[0], 201);
    assert.deepEqual(f.res.set.firstCall.args[0], { "x-kept": "yes" });
    assert.deepEqual(f.res.send.firstCall.args[0], {
      kept: true,
      _tokens: [],
      _revoke: [],
    });
  });

  it("still supports existing callbacks that mutate shared references", async () => {
    const response = {};
    const tokens = [];
    const f = fixture({
      response,
      tokens,
      thenFn: async () => {
        response.ready = true;
        tokens.push({ value: "legacy-token" });
      },
    });
    await f.run();
    assert.deepEqual(f.res.send.firstCall.args[0], {
      ready: true,
      _tokens: tokens,
      _revoke: undefined,
    });
  });

  it("waits for event admission and then the asynchronous callback before sending", async () => {
    let admit;
    let finish;
    const admission = new Promise((resolve) => {
      admit = resolve;
    });
    const callback = new Promise((resolve) => {
      finish = resolve;
    });
    const thenFn = fake.returns(callback);
    const f = fixture({ events: [event], thenFn }, fake.returns(admission));
    const pending = f.run();
    await new Promise(setImmediate);
    assert.equal(thenFn.callCount, 0);
    admit();
    await new Promise(setImmediate);
    assert.equal(thenFn.callCount, 1);
    assert.equal(f.res.send.callCount, 0);
    finish({ response: { ready: true } });
    await pending;
    assert.equal(f.res.send.firstCall.args[0].ready, true);
    assert.equal(f.res.status.firstCall.args[0], 202);
  });

  it("keeps runtime trace and token metadata authoritative", async () => {
    const token = { value: "real-token" };
    const f = fixture({
      events: [event],
      thenFn: fake.resolves({
        response: { _id: "supplied", _tx: "supplied", _tokens: ["supplied"] },
        tokens: [token],
      }),
    });
    await f.run();
    const body = f.res.send.firstCall.args[0];
    assert.notEqual(body._id, "supplied");
    assert.notEqual(body._tx, "supplied");
    assert.deepEqual(body._tokens, [token]);
  });

  it("does not submit returned events or chain another callback", async () => {
    const nested = fake();
    const f = fixture({
      thenFn: fake.resolves({
        events: [event],
        thenFn: nested,
        response: { ready: true },
      }),
    });
    await f.run();
    assert.equal(f.addFn.callCount, 0);
    assert.equal(nested.callCount, 0);
    assert.deepEqual(f.res.send.firstCall.args[0], { ready: true });
  });

  it("propagates callback failure after event admission without sending success", async () => {
    const failure = new Error("Callback failed.");
    const f = fixture({ events: [event], thenFn: fake.rejects(failure) });
    await assert.rejects(f.run(), (e) => e === failure);
    assert.equal(f.addFn.callCount, 1);
    assert.equal(f.res.send.callCount, 0);
    assert.equal(f.res.sendStatus.callCount, 0);
  });

  it("does not invoke the callback when event submission fails", async () => {
    const failure = new Error("Submission failed.");
    const thenFn = fake.resolves({ response: { ready: true } });
    const f = fixture({ events: [event], thenFn }, fake.rejects(failure));
    await assert.rejects(f.run(), (e) => e === failure);
    assert.equal(thenFn.callCount, 0);
    assert.equal(f.res.send.callCount, 0);
  });
});
