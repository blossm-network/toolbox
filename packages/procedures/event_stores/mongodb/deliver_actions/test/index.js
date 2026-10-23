import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import deliverActions from "../index.js";
import deps from "../deps.js";

describe("Durable action delivery", () => {
  afterEach(restore);

  for (const receipt of [
    undefined,
    {},
    { statusCode: 202 },
    { id: "action", intentHash: "different" },
    { id: "different", intentHash: "intent" },
  ]) {
    it(`retains pending work without its matching durable receipt: ${JSON.stringify(
      receipt
    )}`, async () => {
      const action = { id: "action", intentHash: "intent", intent: "{}" };
      const remove = fake.resolves();
      const write = fake.resolves();
      replace(deps, "db", {
        find: fake.resolves([action]),
        remove,
        write,
      });
      await rejects(
        deliverActions({
          actionsStore: "actions",
          deliverActionFn: fake.resolves(receipt),
        })()
      );
      expect(remove.callCount).to.equal(0);
      expect(write.callCount).to.equal(1);
    });
  }

  it("removes the action only after its matching durable receipt", async () => {
    const action = { id: "action", intentHash: "intent", intent: "{}" };
    const remove = fake.resolves();
    replace(deps, "db", {
      find: fake.resolves([action]),
      remove,
      write: fake.resolves(),
    });
    const deliverActionFn = fake.resolves({
      id: action.id,
      intentHash: action.intentHash,
    });
    await deliverActions({ actionsStore: "actions", deliverActionFn })();
    expect(deliverActionFn.firstCall.args[0]).to.equal(action);
    expect(remove.firstCall.args[0].query).to.deep.equal({ id: action.id });
  });
});
