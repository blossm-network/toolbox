import assert from "assert";
import { deployment } from "./deploy.js";

describe("CLI deployment result", () => {
  it("preserves the caller's dependencies and lockfile even during dry-run", async () => {
    for (const dryRun of [false, true]) {
      const fixture = await deployment({ input: { dryRun, path: "nested" } });
      await fixture.run();
      assert.deepStrictEqual(fixture.removed, ["/fixture/build"]);
    }
  });
});
