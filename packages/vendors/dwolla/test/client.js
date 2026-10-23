import assert from "node:assert/strict";
import deps from "../deps.js";

describe("Dwolla SDK composition", () => {
  it("constructs the actual SDK client in the selected sandbox", () => {
    const client = deps.dwolla("dummy", "dummy", { environment: "sandbox" });
    assert.equal(client.environment, "sandbox");
    assert.equal(client.apiUrl, "https://api-sandbox.dwolla.com");
    for (const method of ["get", "post", "delete"]) {
      assert.equal(typeof client[method], "function");
    }
  });
});
