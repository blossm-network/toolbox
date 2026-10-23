import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";
import pendingDeps from "../src/pending_deps.js";
import deliverActions from "../src/deliver_actions.js";

describe("Durable action delivery", () => {
  afterEach(restore);

  for (const receipt of [
    undefined,
    {},
    { statusCode: 202 },
    { id: "action", intentHash: "different" },
    { id: "different", intentHash: "intent" },
  ]) {
    it(`retains pending work without its matching durable receipt: ${JSON.stringify(receipt)}`, async () => {
      const action = { id: "action", intentHash: "intent", intent: "{}" };
      const remove = fake.resolves();
      const write = fake.resolves();
      replace(pendingDeps, "db", {
        find: fake.resolves([action]),
        remove,
        write,
      });
      await assert.rejects(
        deliverActions({
          actionsStore: "actions",
          deliverActionFn: fake.resolves(receipt),
        })()
      );
      assert.equal(remove.callCount, 0);
      assert.equal(write.callCount, 1);
    });
  }

  it("removes the action only after its matching durable receipt", async () => {
    const action = { id: "action", intentHash: "intent", intent: "{}" };
    const remove = fake.resolves();
    replace(pendingDeps, "db", {
      find: fake.resolves([action]),
      remove,
      write: fake.resolves(),
    });
    const deliverActionFn = fake.resolves({
      id: action.id,
      intentHash: action.intentHash,
    });
    await deliverActions({ actionsStore: "actions", deliverActionFn })();
    assert.equal(deliverActionFn.firstCall.args[0], action);
    assert.deepEqual(remove.firstCall.args[0].query, { id: action.id });
  });
});

describe("Durable action server composition", () => {
  let nodeEnv;
  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    __resetStoresForTest();
    replace(deps, "db", { store: fake(async ({ name }) => ({ name })) });
    replace(deps, "eventStore", fake());
  });
  afterEach(() => {
    restore();
    __resetStoresForTest();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  });

  for (const hooks of [{ actionsFn: fake() }, { deliverActionFn: fake() }]) {
    it("requires both trusted preparation and delivery", async () => {
      await assert.rejects(
        server({ ...hooks }),
        /both preparation and delivery/
      );
      assert.equal(deps.db.store.callCount, 0);
    });
  }

  it("rejects local mode before silently bypassing the action transaction", async () => {
    process.env.NODE_ENV = "local";
    await assert.rejects(
      server({ actionsFn: fake(), deliverActionFn: fake() }),
      /local mode disables/
    );
    assert.equal(deps.db.store.callCount, 0);
  });

  it("wires action persistence and drains it despite publication failure", async () => {
    const actionsFn = fake.returns([]);
    const deliverActionFn = fake();
    const saveEventsFn = fake();
    const failure = new Error("publication failed");
    const drainActions = fake.resolves();
    replace(deps, "saveEvents", fake.returns(saveEventsFn));
    replace(deps, "publishPending", fake.returns(fake.rejects(failure)));
    replace(deps, "deliverActions", fake.returns(drainActions));
    await server({
      schema: {},
      actionsFn,
      deliverActionFn,
      publishFn: fake(),
      secretFn: fake.resolves("secret"),
    });
    const settings = deps.saveEvents.firstCall.args[0];
    assert.deepEqual(settings.actionsStore, { name: "actions" });
    assert.equal(settings.actionsFn, actionsFn);
    const model = deps.db.store
      .getCalls()
      .map((call) => call.args[0])
      .find((options) => options.name === "actions");
    assert.equal(model.schema.id.unique, true);
    assert.equal(model.schema.intent.$type, String);
    const composition = deps.eventStore.firstCall.args[0];
    assert.equal(composition.saveEventsFn, saveEventsFn);
    await assert.rejects(
      composition.publishPendingFn(),
      (error) => error === failure
    );
    assert.equal(drainActions.callCount, 1);
  });
});
