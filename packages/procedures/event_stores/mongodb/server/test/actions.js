import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";

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
      await rejects(server({ ...hooks }), /both preparation and delivery/);
      expect(deps.db.store.callCount).to.equal(0);
    });
  }

  it("rejects local mode before silently bypassing the action transaction", async () => {
    process.env.NODE_ENV = "local";
    await rejects(
      server({ actionsFn: fake(), deliverActionFn: fake() }),
      /local mode disables/
    );
    expect(deps.db.store.callCount).to.equal(0);
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
    expect(settings.actionsStore).to.deep.equal({ name: "actions" });
    expect(settings.actionsFn).to.equal(actionsFn);
    const model = deps.db.store
      .getCalls()
      .map((call) => call.args[0])
      .find((options) => options.name === "actions");
    expect(model.schema.id.unique).to.equal(true);
    expect(model.schema.intent.$type).to.equal(String);
    const composition = deps.eventStore.firstCall.args[0];
    expect(composition.saveEventsFn).to.equal(saveEventsFn);
    await rejects(composition.publishPendingFn(), (error) => error === failure);
    expect(drainActions.callCount).to.equal(1);
  });
});
