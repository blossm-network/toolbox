import assert from "assert";
import * as chai from "chai";
import { load } from "./load.js";

const suite = async (domain, broken = false) => {
  const cases = [];
  const before = [];
  const after = [];
  const requests = [];
  const deleted = [];
  const routes = [
    { name: "protected", privileges: [] },
    { name: "public", protection: "none", privileges: "none" },
  ];
  const transport = async (url, options) => {
    requests.push({ url, options });
    const authorization = options.headers && options.headers.Authorization;
    return {
      statusCode: broken
        ? 500
        : url.endsWith("/public") ||
          (url === "http://main" && options.body.context) ||
          authorization === "Bearer valid"
        ? 200
        : 401,
    };
  };
  await load(`blossm/src/${domain}/deploy/src/base_test/integration/index.js`, {
    chai,
    process: { env: { MAIN_CONTAINER_NAME: "main" } },
    config: {
      [domain === "command_gateway"
        ? "commands"
        : domain === "fact_gateway"
        ? "facts"
        : "views"]: routes,
      testing: { topics: ["existing", "temporary"] },
    },
    describe: (_, fn) => fn(),
    it: (_, fn) => cases.push(fn),
    before: (fn) => before.push(fn),
    after: (fn) => after.push(fn),
    gcpPubsub: {
      exists: async (topic) => topic === "existing",
      create: async () => {},
      del: async (topic) => deleted.push(topic),
    },
    request: { get: transport, post: transport },
    getToken: async () => ({ token: "valid" }),
    decode: () => ({ claims: { context: {} } }),
    dateString: () => "2026-10-22T00:00:00.000Z",
  });
  return {
    requests,
    deleted,
    run: async () => {
      for (const fn of before) await fn();
      try {
        for (const fn of cases) await fn();
      } finally {
        for (const fn of after) await fn();
      }
    },
  };
};

describe("Generated gateway integration suites", () => {
  for (const domain of ["command_gateway", "fact_gateway", "view_gateway"]) {
    it(`${domain} executes requests and cleans up only newly created topics`, async () => {
      const test = await suite(domain);
      await test.run();
      assert(test.requests.length >= 4);
      assert(test.requests.some(({ url }) => url.endsWith("/protected")));
      assert(test.requests.some(({ url }) => url.endsWith("/public")));
      assert.deepStrictEqual(test.deleted, ["temporary"]);
    });
    it(`${domain} fails for a broken generated endpoint`, async () => {
      const test = await suite(domain, true);
      await assert.rejects(test.run(), chai.AssertionError);
      assert(test.requests.length > 0);
    });
  }
});
