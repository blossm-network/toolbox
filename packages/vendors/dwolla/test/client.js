import assert from "node:assert/strict";
import deps from "../deps.js";
import dwolla from "../index.js";

describe("Dwolla SDK composition", () => {
  it("constructs the actual SDK client in the selected sandbox", () => {
    const client = deps.dwolla("dummy", "dummy", { environment: "sandbox" });
    assert.equal(client.environment, "sandbox");
    assert.equal(client.apiUrl, "https://api-sandbox.dwolla.com");
    for (const method of ["get", "post", "delete"]) {
      assert.equal(typeof client[method], "function");
    }
  });

  it("constructs the public adapter with the actual SDK client", () => {
    const adapter = dwolla("dummy", "dummy", { environment: "sandbox" });
    for (const group of ["customer", "businessAuthority"])
      for (const method of Object.values(adapter[group]))
        assert.equal(typeof method, "function");
  });
});
