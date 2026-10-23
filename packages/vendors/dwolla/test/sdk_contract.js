import assert from "node:assert/strict";
import createUnverified from "../src/customer/create_unverified.js";
import createVerifiedPersonal from "../src/customer/create_verified_personal.js";
import createVerifiedBusiness from "../src/customer/create_verified_business.js";
import createReceiveOnly from "../src/customer/create_receive_only.js";

const location = "https://api-sandbox.dwolla.com/customers/dummy";

describe("Dwolla SDK response contracts", () => {
  for (const [name, operation] of Object.entries({
    createUnverified,
    createVerifiedPersonal,
    createVerifiedBusiness,
    createReceiveOnly,
  })) {
    it(`${name} returns Location from Headers after an empty-body creation`, async () => {
      const result = await operation({
        async post() {
          return { headers: new Headers({ location }), body: "" };
        },
      })({});
      assert.equal(result, location);
    });
  }
  it("uses SDK status and body.code for validation failures", async () => {
    const error = Object.assign(new Error("validation"), {
      status: 400,
      body: {
        code: "ValidationError",
        _embedded: { errors: [{ message: "missing", path: "/email" }] },
      },
    });
    await assert.rejects(
      createUnverified({
        async post() {
          throw error;
        },
      })({}),
      (result) => {
        assert.equal(result.statusCode, 400);
        assert.deepEqual(result.info().errors, [
          { message: "missing", path: "email" },
        ]);
        return true;
      }
    );
  });
  it("maps an SDK forbidden status", async () => {
    const error = Object.assign(new Error("forbidden"), {
      status: 403,
      body: { code: "Forbidden" },
    });
    await assert.rejects(
      createUnverified({
        async post() {
          throw error;
        },
      })({}),
      (result) => result.statusCode === 403
    );
  });
  for (const status of [429, 500, undefined]) {
    it(`preserves ${
      status || "transport"
    } failures for recovery instead of mapping BadRequest`, async () => {
      const error = Object.assign(new Error("unavailable"), { status });
      await assert.rejects(
        createUnverified({
          async post() {
            throw error;
          },
        })({}),
        (result) => result === error
      );
    });
  }
});
