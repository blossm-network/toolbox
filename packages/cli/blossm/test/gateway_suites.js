import assert from "assert";
import { once } from "events";
import * as chai from "chai";
import { replace, restore } from "sinon";
import getToken, { gatewayTokenOptions } from "../../utils/get_token/index.js";
import tokenDeps from "../../utils/get_token/deps.js";
import request from "../../../lib/request/index.js";
import authenticationDeps from "../../../middleware/authentication/deps.js";
import rolePermissions from "../../../lib/role_permissions/index.js";
import serverDeps from "../../../procedures/server/deps.js";
import commandGateway from "../../../procedures/gateways/command/server/index.js";
import commandDeps from "../../../procedures/gateways/command/server/deps.js";
import factGateway from "../../../procedures/gateways/fact/server/index.js";
import factDeps from "../../../procedures/gateways/fact/server/deps.js";
import viewGateway from "../../../procedures/gateways/view/server/index.js";
import viewDeps from "../../../procedures/gateways/view/server/deps.js";
import { load } from "./load.js";
import viewGetDeps from "../../../procedures/gateways/view/get/deps.js";
import errorDeps from "../../../middleware/error/deps.js";

const gateways = {
  command_gateway: [commandGateway, commandDeps, "commands", "post"],
  fact_gateway: [factGateway, factDeps, "facts", "get"],
  view_gateway: [viewGateway, viewDeps, "views", "get"],
};
const node = {
  root: "node-root",
  service: "system",
  network: "fixture.network",
};

// Execute generated suites through the real request encoder, loopback HTTP,
// gateway route composition and authentication/authorization middleware.
// Replace only cloud/data/business operations, never the transport or policy.
const suite = async (domain, { broken = false, context } = {}) => {
  const cases = [],
    before = [],
    after = [],
    requests = [],
    deleted = [];
  const events = new Map(),
    tokens = new Map();
  const routes = [
    { name: "default" },
    { name: "protected", privileges: "none", permissions: "none" },
    { name: "granted", privileges: ["read"], permissions: ["system:key:read"] },
    { name: "restricted", protection: { node: [node] }, context: "node" },
    { name: "public", protection: "none", privileges: "none" },
    { name: "context", protection: "context", privileges: "none" },
  ].map((route) => ({ ...route, procedure: "view-store" }));
  if (domain === "view_gateway")
    routes.push({ name: "empty", permissions: [], procedure: "view-store" });
  const [gateway, deps, key, method] = gateways[domain];
  replace(errorDeps.logger, "info", () => {});
  replace(errorDeps.logger, "error", () => {});
  const app = serverDeps.express();
  app.use(serverDeps.express.json());
  let listener, ready;
  const server = {
    get: (fn, { path, preMiddleware = [] } = {}) => {
      app.get(path, ...preMiddleware, serverDeps.asyncHandler(fn));
      return server;
    },
    post: (fn, { path, preMiddleware = [] } = {}) => {
      app.post(path, ...preMiddleware, serverDeps.asyncHandler(fn));
      return server;
    },
    listen: () => {
      app.use(serverDeps.errorMiddleware);
      listener = app.listen(0, "127.0.0.1");
      ready = once(listener, "listening");
    },
  };
  replace(deps, "server", () => server);
  if (domain === "view_gateway") {
    replace(viewGetDeps, "viewStore", ({ name }) => ({
      set: ({ context }) => ({
        read: async (query) => {
          requests.push({ path: `/${name}`, query, context });
          assert.strictEqual(query.root, "some-root");
          if (broken) throw new Error("Broken view business endpoint");
          return { body: {} };
        },
      }),
    }));
  } else
    replace(deps, method, () => (req, res) => {
      requests.push({ path: req.path, query: req.query, context: req.context });
      if (domain === "command_gateway")
        assert.deepStrictEqual(req.body.payload, {});
      else assert.strictEqual(req.query.root, "some-root");
      res.status(broken ? 500 : 200).send({});
    });
  replace(tokenDeps, "hash", async () => "password-hash");
  replace(tokenDeps, "eventStore", ({ domain, service }) => {
    assert.strictEqual(service, "core");
    return {
      add: async ({ eventData }) => {
        for (const { event } of eventData)
          events.set(event.headers.root, { domain, ...event });
      },
    };
  });
  replace(tokenDeps, "command", () => ({
    set: ({ context }) => ({
      issue: async ({ principal }) => {
        const token = `fixture-${tokens.size}`;
        tokens.set(token, { context: { ...context, principal } });
        return { body: { _tokens: [{ value: token }] } };
      },
    }),
  }));
  replace(authenticationDeps, "authenticate", async ({ jwt }) => {
    if (!tokens.has(jwt))
      throw authenticationDeps.unauthorizedError.message(
        "Invalid fixture token",
      );
    return tokens.get(jwt);
  });
  await gateway({
    [key]: routes,
    context,
    verifyFn: () => () => {},
    permissionsLookupFn: async ({ principal, context }) =>
      rolePermissions({
        roles: events.get(principal.root).payload.roles,
        defaultRoles: {},
        context,
        customRolePermissionsFn: async ({ roleId }) =>
          [...events.values()].find(
            (event) => event.domain === "role" && event.payload.id === roleId,
          ).payload.permissions,
      }),
    terminatedSessionCheckFn: async ({ session }) => {
      assert.strictEqual(session.service, "core");
      assert.strictEqual(events.get(session.root).domain, "session");
    },
    deletedSceneCheckFn: async () => {},
  });
  await ready;
  try {
    await load(
      `blossm/src/${domain}/deploy/src/base_test/integration/index.js`,
      {
        chai,
        process: {
          env: {
            ...process.env,
            MAIN_CONTAINER_NAME: `127.0.0.1:${listener.address().port}`,
          },
        },
        config: {
          [key]: routes,
          context,
          testing: {
            topics: ["existing", "temporary"],
            context: context ? { [context]: node } : {},
          },
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
        request,
        getToken,
        gatewayTokenOptions,
        decode: (token) => ({ claims: tokens.get(token) }),
        dateString: () => "2026-11-10T00:00:00.000Z",
      },
    );
    for (const fn of before) await fn();
    try {
      for (const fn of cases) await fn();
    } finally {
      for (const fn of after) await fn();
    }
    return { requests, deleted };
  } finally {
    await new Promise((resolve) => {
      listener.close(resolve);
      listener.closeAllConnections();
    });
  }
};

describe("Generated gateway integration suites", () => {
  const previous = { ...process.env };
  beforeEach(() => {
    process.env.NETWORK = "fixture.network";
    process.env.SERVICE = "system";
    process.env.DOMAIN = "key";
    delete process.env.CONTEXT;
  });
  afterEach(() => {
    restore();
    process.env = { ...previous };
  });
  for (const domain of Object.keys(gateways)) {
    it(`${domain} exercises protected/object/public/context routes and native query transport`, async () => {
      const result = await suite(domain);
      assert.deepStrictEqual(
        result.requests.map(({ path }) => path).sort(),
        [
          "/context",
          "/default",
          "/granted",
          "/protected",
          "/public",
          "/restricted",
        ].sort(),
      );
      assert.deepStrictEqual(result.deleted, ["temporary"]);
    });
    it(`${domain} rejects a broken business endpoint`, async () => {
      await assert.rejects(
        suite(domain, { broken: true }),
        chai.AssertionError,
      );
    });
  }
  it("view channels require configured query context and permit permission-free contextless discovery", async () => {
    process.env.CONTEXT = "node";
    const result = await suite("view_gateway", { context: "node" });
    assert.strictEqual(result.requests.length, 4);
  });
});
