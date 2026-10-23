import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import createSession from "../src/projection/deploy/src/session.js";
import path from "node:path";
import { load } from "./load.js";

const lease = {
  playId: "play",
  owner: "owner",
  generation: 1,
  limits: {
    maxOperations: 1,
    maxBytes: 65536,
    leaseMilliseconds: 30000,
    maxPlayMilliseconds: 1000,
  },
};

describe("Projection session client", () => {
  it("stops a stuck transform at the advertised deadline without committing", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        return {
          body: {
            ...lease,
            limits: { ...lease.limits, maxPlayMilliseconds: 5 },
          },
        };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({ playId: "play", run: () => new Promise(() => {}) }),
      /deadline/
    );
    assert.deepEqual(actions, ["begin", "release"]);
  });

  it("adds stable invocation IDs before the CLI enqueues a play or replay", async () => {
    const rootConfig = {
      vendors: {
        cloud: {
          gcp: {
            projects: { development: "project" },
            computeUrlIds: { development: "compute" },
          },
        },
      },
    };
    for (const data of [
      undefined,
      { root: "root" },
      { root: "root", playId: "explicit" },
    ]) {
      let task;
      const execute = await load("utils/execute_cli_template/index.js", {
        normalize: async () => ({
          env: "development",
          region: "us-central1",
          ...(data && { data: JSON.stringify(data) }),
        }),
        rootDir: { config: () => rootConfig },
        fs: { readFileSync: () => "" },
        yaml: { parse: () => ({ procedure: "projection", name: "cards" }) },
        path,
        process: { cwd: () => "/tmp" },
        console: { log: () => {} },
        roboSay: () => "",
        gcpQueue: {
          enqueue: () => async (value) => {
            task = value;
          },
        },
        uuid: () => "generated",
      });
      await execute({ domain: "projection" })([], () => ({
        operationName: "cards",
        operationHash: "hash",
      }));
      assert.deepEqual(
        task.data,
        data
          ? { ...data, playId: data.playId || "generated" }
          : { replayId: "generated" }
      );
    }
  });

  it("enforces destination-provided limits before submitting a batch", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        return { body: lease };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({
        playId: "play",
        run: async (session) => {
          session.add({ type: "delete", id: "one" });
          session.add({ type: "delete", id: "two" });
        },
      }),
      /exceeds/
    );
    assert.deepEqual(actions, ["begin", "release"]);
  });

  it("does not submit mutations after an uncertain renewal", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        if (action === "renew") throw new Error("Renewal lost");
        return {
          body: { ...lease, limits: { ...lease.limits, leaseMilliseconds: 3 } },
        };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({ playId: "play", run: async () => delay(10) }),
      /Renewal lost/
    );
    assert.ok(actions.includes("renew"));
    assert.ok(!actions.includes("commit"));
    assert.equal(actions.at(-1), "release");
  });

  it("reloads a notification's current body and groups before sending", async () => {
    const current = {
      view: { headers: { id: "row", groups: ["current"] }, body: { count: 2 } },
    };
    let pushed;
    const execute = createSession({
      request: async ({ action }) => {
        if (action === "begin") return { body: lease };
        if (action === "commit")
          return {
            body: {
              generation: 1,
              results: [
                {
                  type: "put",
                  result: {
                    view: { headers: { id: "row" }, body: { count: 1 } },
                  },
                },
              ],
            },
          };
        if (action === "notification") return { body: current };
        return { body: {} };
      },
      pushFn: async (value) => {
        pushed = value;
      },
    });
    await execute({ playId: "play", run: async () => {} });
    assert.equal(pushed, current);
  });
});
