import { expect } from "chai";
import post from "../index.js";

const normalizeTransactionFn = (tx) => tx;

describe("Transactional counter ordering", () => {
  it("serializes roots in stable order within one transaction", async () => {
    let active = 0;
    let maximum = 0;
    const roots = [];
    await post({
      normalizeTransactionFn,
      eventData: ["z", "a"].map((root) => ({
        event: {
          headers: {
            root,
            domain: process.env.DOMAIN,
            service: process.env.SERVICE,
            network: process.env.NETWORK,
          },
        },
      })),
      reserveRootCountsFn: async ({ root, transaction }) => {
        expect(transaction).to.equal("session");
        roots.push(root);
        active++;
        maximum = Math.max(maximum, active);
        await Promise.resolve();
        active--;
        return { root, value: 1 };
      },
      saveEventsFn: async () => {},
    })("session");
    expect(maximum).to.equal(1);
    expect(roots).to.deep.equal(["a", "z"]);
  });
  it("stops reserving roots and does not save events after a reservation fails", async () => {
    const failure = new Error("reservation failed");
    const roots = [];
    let saved = false;
    try {
      await post({
        normalizeTransactionFn,
        eventData: ["z", "a"].map((root) => ({
          event: {
            headers: {
              root,
              domain: process.env.DOMAIN,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
            },
          },
        })),
        reserveRootCountsFn: async ({ root }) => {
          roots.push(root);
          throw failure;
        },
        saveEventsFn: async () => {
          saved = true;
        },
      })("session");
      expect.fail("a failed reservation must reject");
    } catch (error) {
      expect(error).to.equal(failure);
    }
    expect(roots).to.deep.equal(["a"]);
    expect(saved).to.equal(false);
  });
});
