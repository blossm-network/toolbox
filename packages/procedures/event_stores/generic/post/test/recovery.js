import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import post from "../index.js";
import deps from "../deps.js";

describe("Durable publication recovery", () => {
  afterEach(restore);
  it("drains pending notifications even when retry events were already committed", async () => {
    replace(deps, "postTransaction", () => async () => ({ receipt: [] }));
    const publishPendingFn = fake.resolves();
    process.env.NODE_ENV = "audit";
    await post({
      idempotencyConflictCheckFn: async () => true,
      createTransactionFn: (fn) => fn(),
      publishPendingFn,
    })(
      {
        body: {
          eventData: [{ event: { headers: { idempotency: "existing" } } }],
        },
      },
      { sendStatus() {} }
    );
    expect(publishPendingFn.callCount).to.equal(1);
  });
});
