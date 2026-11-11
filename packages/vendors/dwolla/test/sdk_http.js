import assert from "node:assert/strict";
import { createServer } from "node:http";
import { replace, restore } from "sinon";
import dwolla from "../index.js";
import deps from "../deps.js";

const realClient = deps.dwolla;
const location = "https://api-sandbox.dwolla.com/customers/fixture";

describe("Actual Dwolla SDK HTTP contracts", () => {
  let server;
  let plan;
  let requests;
  let sdkErrors;
  let adapter;

  beforeEach(async () => {
    plan = { status: 201, headers: { location }, body: "" };
    requests = [];
    sdkErrors = [];
    server = createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      requests.push({
        method: req.method,
        path: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString(),
      });
      if (plan.reset) return res.destroy();
      res.writeHead(plan.status, plan.headers || {});
      res.end(
        typeof plan.body === "string" ? plan.body : JSON.stringify(plan.body),
      );
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const client = realClient("dummy", "dummy", { environment: "sandbox" });
    client.apiUrl = `http://127.0.0.1:${server.address().port}`;
    // A seeded SDK Token exercises its real HTTP/parser methods without OAuth.
    const token = client.token({ access_token: "fixture", expires_in: 3600 });
    for (const method of ["get", "post", "delete"]) {
      const original = token[method].bind(token);
      token[method] = (...args) =>
        original(...args).catch((error) => {
          sdkErrors.push(error);
          throw error;
        });
    }
    replace(deps, "dwolla", () => token);
    adapter = dwolla("dummy", "dummy", { environment: "sandbox" });
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    restore();
  });

  for (const name of [
    "createUnverified",
    "createVerifiedPersonal",
    "createVerifiedBusiness",
    "createReceiveOnly",
  ]) {
    it(`${name} returns the SDK Location after an empty 201 response`, async () => {
      const result = await adapter.customer[name](
        {
          firstName: "Fixture",
          lastName: "User",
          email: "fixture@example.invalid",
        },
        { idempotencyKey: "fixture-key" },
      );
      assert.equal(result, location);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].method, "POST");
      assert.equal(requests[0].path, "/customers");
      assert.equal(requests[0].headers.authorization, "Bearer fixture");
      assert.equal(requests[0].headers["idempotency-key"], "fixture-key");
      assert.equal(sdkErrors.length, 0);
    });
  }

  it("maps the installed SDK's validation status/body into public error details", async () => {
    plan = {
      status: 400,
      body: {
        code: "ValidationError",
        _embedded: {
          errors: [{ message: "Owner field is required", path: "/owners/0/x" }],
        },
      },
    };
    await assert.rejects(adapter.customer.createUnverified({}), (error) => {
      assert.equal(sdkErrors[0].status, 400);
      assert.equal(sdkErrors[0].statusCode, undefined);
      assert.equal(sdkErrors[0].body.code, "ValidationError");
      assert.equal(error.statusCode, 400);
      assert.deepEqual(error.info().errors, [
        { message: "Owner field is required", path: "owners.0.x" },
      ]);
      return true;
    });
    assert.equal(requests.length, 1);
  });

  it("maps an actual SDK forbidden response", async () => {
    plan = { status: 403, body: { code: "Forbidden", message: "Denied" } };
    await assert.rejects(
      adapter.customer.createUnverified({}),
      (error) => error.statusCode === 403,
    );
    assert.equal(requests.length, 1);
  });

  it("maps an actual SDK missing-authority response", async () => {
    plan = { status: 404, body: { code: "NotFound", message: "Missing" } };
    await assert.rejects(
      adapter.businessAuthority.get("fixture"),
      (error) => error.statusCode === 404,
    );
    assert.equal(requests[0].path, "/beneficial-owners/fixture");
  });

  for (const status of [429, 500, 503]) {
    it(`preserves the original SDK ${status} error without retrying`, async () => {
      plan = { status, body: { code: "Unavailable", message: "Try later" } };
      await assert.rejects(adapter.customer.createUnverified({}), (error) => {
        assert.equal(error, sdkErrors[0]);
        assert.equal(error.status, status);
        assert.equal(error.statusCode, undefined);
        return true;
      });
      assert.equal(requests.length, 1);
    });
  }

  it("preserves the SDK transport error after a reset without retrying", async () => {
    plan = { reset: true };
    await assert.rejects(adapter.customer.createUnverified({}), (error) => {
      assert.equal(error, sdkErrors[0]);
      assert.equal(error.status, undefined);
      return true;
    });
    assert.equal(requests.length, 1);
  });
});
