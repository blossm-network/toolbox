import assert from "assert";
import { load } from "./load.js";
import authorization from "../../../middleware/authorization/index.js";

describe("Generated view gateway revocation", () => {
  it("uses the existing session and scene checks", async () => {
    const terminatedSessionCheck = async () => {
      throw new Error("terminated session");
    };
    const deletedSceneCheck = async () => {
      throw new Error("deleted scene");
    };
    const gateway = await load("blossm/src/view_gateway/deploy/src/index.js", {
      gateway: (options) => options,
      config: { views: [] },
      process: { env: {} },
      gcpToken: () => {},
      nodeExternalToken: () => {},
      permissionsLookup: () => () => {},
      gcpStorage: {},
      terminatedSessionCheck,
      deletedSceneCheck,
    });
    assert.strictEqual(
      gateway.terminatedSessionCheckFn,
      terminatedSessionCheck
    );
    assert.strictEqual(gateway.deletedSceneCheckFn, deletedSceneCheck);
    await assert.rejects(
      gateway.terminatedSessionCheckFn(),
      /terminated session/
    );
    await assert.rejects(gateway.deletedSceneCheckFn(), /deleted scene/);
    for (const [key, message] of [
      ["session", "terminated session"],
      ["scene", "deleted scene"],
    ]) {
      const error = await new Promise((resolve) =>
        authorization(gateway)(
          { context: { [key]: { root: "revoked" } } },
          null,
          resolve
        )
      );
      assert(error instanceof Error);
      assert.strictEqual(error.message, message);
    }
  });
});
