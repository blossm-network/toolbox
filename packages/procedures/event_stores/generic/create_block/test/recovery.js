import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import createBlock from "../index.js";
import deps from "../deps.js";

describe("Scheduled publication recovery", () => {
  afterEach(restore);
  it("drains committed notices even when the created block has no changed roots", async () => {
    process.env.NODE_ENV = "audit";
    replace(deps, "createBlockTransaction", () => async () => ({
      block: { headers: { sCount: 0 } },
      full: false,
    }));
    const publishPendingFn = fake.resolves();
    await createBlock({ createTransactionFn: (fn) => fn(), publishPendingFn })(
      {},
      { send() {} }
    );
    expect(publishPendingFn.callCount).to.equal(1);
  });
  it("does not dispatch in explicit local mode", async () => {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    replace(deps, "createBlockTransaction", () => async () => ({
      block: {},
      full: false,
    }));
    const publishPendingFn = fake.resolves();
    try {
      await createBlock({
        createTransactionFn: (fn) => fn(),
        publishPendingFn,
      })({}, { send() {} });
      expect(publishPendingFn.callCount).to.equal(0);
    } finally {
      if (nodeEnv == undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
    }
  });
});
