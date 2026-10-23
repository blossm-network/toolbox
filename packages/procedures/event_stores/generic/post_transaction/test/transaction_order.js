import { expect } from "chai";
import { replace, restore } from "sinon";
import post from "../index.js";
import deps from "../deps.js";

describe("Transactional counter ordering", () => {
  afterEach(restore);
  it("serializes roots in stable order within one transaction", async () => {
    let active = 0;
    let maximum = 0;
    const roots = [];
    replace(deps, "hash", () => ({ create: () => "hash" }));
    await post({
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
});
