import assert from "assert";
import { load } from "./load.js";

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
  });
});
