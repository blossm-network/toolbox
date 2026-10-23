import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import save from "../index.js";
import deps from "../deps.js";

const event = {
  hash: "event-hash",
  headers: {
    action: "answer",
    topic: "answer.challenge.core",
    committed: "2026-10-23T12:00:00.000Z",
  },
};
const intent = {
  name: "upgrade",
  payload: { principal: { root: "principal" } },
};
const options = {
  eventStore: "events",
  actionsStore: "actions",
  handlers: { answer() {} },
};
const input = { events: [event], transaction: "session" };

describe("Transactional action persistence", () => {
  afterEach(restore);

  it("stores immutable intents with stable IDs and hashes on the event session", async () => {
    const create = fake.resolves();
    replace(deps, "db", { create });
    const secondEvent = { ...event, hash: "second-event-hash" };
    const calls = [];
    let preparing = false;
    await save({
      ...options,
      publicationsStore: "publications",
      actionsFn: async (source) => {
        assert.equal(preparing, false);
        assert.equal(create.callCount, 2);
        preparing = true;
        await new Promise(setImmediate);
        preparing = false;
        calls.push(source);
        return source === event ? [intent, intent] : [intent];
      },
    })({ events: [event, secondEvent], transaction: "session" });
    assert.deepEqual(calls, [event, secondEvent]);
    assert.equal(create.callCount, 3);
    for (const call of create.getCalls())
      assert.deepEqual(call.args[0].options, { session: "session" });
    const persisted = create.thirdCall.args[0];
    assert.equal(persisted.store, "actions");
    assert.deepEqual(
      persisted.data.map(({ id }) => id),
      ["event-hash:0", "event-hash:1", "second-event-hash:0"]
    );
    assert.deepEqual(persisted.data[0], {
      id: "event-hash:0",
      eventHash: event.hash,
      intentHash:
        "8fa3a837fac48b711b5c68efa2931a29f85e4cb8c1df4982d0c3be8d14037708",
      intent: JSON.stringify(intent),
      created: event.headers.committed,
    });
    assert.equal(persisted.data[1].intentHash, persisted.data[0].intentHash);
    assert.equal(persisted.data[2].eventHash, secondEvent.hash);
  });

  it("binds distinct boolean intents to their exact stored JSON bytes", async () => {
    const create = fake.resolves();
    replace(deps, "db", { create });
    await save({
      ...options,
      actionsFn: async () => [{ enabled: true }, { enabled: false }],
    })(input);
    const [enabled, disabled] = create.secondCall.args[0].data;
    assert.equal(enabled.intent, '{"enabled":true}');
    assert.equal(disabled.intent, '{"enabled":false}');
    assert.notEqual(enabled.intentHash, disabled.intentHash);
    assert.deepEqual(JSON.parse(enabled.intent), { enabled: true });
    assert.deepEqual(JSON.parse(disabled.intent), { enabled: false });
  });

  it("does not create an action batch when preparation yields no actions", async () => {
    const create = fake.resolves();
    const actionsFn = fake.resolves([]);
    replace(deps, "db", { create });
    await save({ ...options, actionsFn })(input);
    assert.equal(actionsFn.callCount, 1);
    assert.equal(create.callCount, 1);
    assert.equal(create.firstCall.args[0].store, "events");
  });

  it("does not prepare intents for a rejected event batch", async () => {
    const failure = new Error("event insert failed");
    const create = fake.rejects(failure);
    const actionsFn = fake.resolves([intent]);
    replace(deps, "db", { create });
    await assert.rejects(
      save({ ...options, actionsFn })(input),
      (error) => error === failure
    );
    assert.equal(actionsFn.callCount, 0);
  });

  it("skips action preparation for a successful empty submission", async () => {
    const create = fake.resolves();
    const actionsFn = fake.resolves([intent]);
    replace(deps, "db", { create });
    await save({ ...options, actionsFn })({
      events: [],
      transaction: "session",
    });
    assert.equal(actionsFn.callCount, 0);
    assert.equal(create.callCount, 1);
  });

  it("rejects configured actions without a transaction before any persistence", async () => {
    const create = fake.resolves();
    const actionsFn = fake.resolves([intent]);
    replace(deps, "db", { create });
    await assert.rejects(
      save({ ...options, actionsFn })({ events: [event] }),
      /transaction/
    );
    assert.equal(create.callCount, 0);
    assert.equal(actionsFn.callCount, 0);
  });

  for (const configuration of [
    options,
    {
      eventStore: "events",
      actionsFn: async () => [],
      handlers: options.handlers,
    },
  ]) {
    it("rejects an incomplete action configuration before persistence", async () => {
      const create = fake.resolves();
      replace(deps, "db", { create });
      await assert.rejects(
        save(configuration)(input),
        /actions store and preparation/
      );
      assert.equal(create.callCount, 0);
    });
  }

  it("propagates preparation failure to the surrounding transaction", async () => {
    const failure = new Error("intent preparation failed");
    const create = fake.resolves();
    replace(deps, "db", { create });
    await assert.rejects(
      save({ ...options, actionsFn: fake.rejects(failure) })(input),
      (error) => error === failure
    );
    assert.equal(create.callCount, 1);
  });

  it("propagates intent insertion failure with the same transaction session", async () => {
    const failure = new Error("action insert failed");
    const create = fake(async ({ store, options }) => {
      if (store === "actions") {
        assert.deepEqual(options, { session: "session" });
        throw failure;
      }
    });
    replace(deps, "db", { create });
    await assert.rejects(
      save({ ...options, actionsFn: fake.resolves([intent]) })(input),
      (error) => error === failure
    );
    assert.equal(create.callCount, 2);
  });
});
