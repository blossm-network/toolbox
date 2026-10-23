import { expect } from "chai";
import { replace, restore } from "sinon";
import post from "../index.js";
import deps from "../deps.js";

describe("Event batch ordering", () => {
  afterEach(restore);

  it("preserves input order when idempotency checks finish out of order", async () => {
    let releaseFirst;
    let accepted;
    replace(deps, "postTransaction", ({ eventData }) => async () => {
      accepted = eventData;
      return { receipt: [] };
    });
    const eventData = ["first", "second", "second"].map((idempotency) => ({
      event: { headers: { root: "root", idempotency } },
    }));
    const pending = post({
      idempotencyConflictCheckFn: (id) =>
        id === "first"
          ? new Promise((resolve) => {
              releaseFirst = resolve;
            })
          : Promise.resolve(false),
      createTransactionFn: (fn) => fn(),
    })({ body: { eventData } }, { sendStatus() {} });
    await Promise.resolve();
    releaseFirst(false);
    await pending;
    expect(accepted).to.deep.equal(eventData.slice(0, 2));
  });
});
