import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import operationHash from "@blossm/operation-hash";
import rpc from "@blossm/rpc";
import operationShortName from "@blossm/operation-short-name";
import viewComposite from "@blossm/view-composite-rpc";
import rpcDeps from "@blossm/rpc/deps.js";
import loadServices from "./load_services.js";

const previous = Object.fromEntries(["HOST", "NODE_ENV", "CONTEXT", "GCP_COMPUTE_URL_ID"].map(key => [key, process.env[key]]));

describe("Generated operation identity", () => {
  const originalGet = rpcDeps.get;
  const originalPost = rpcDeps.post;
  afterEach(() => {
    rpcDeps.get = originalGet;
    rpcDeps.post = originalPost;
    for (const [key, value] of Object.entries(previous)) {
      if (value == undefined) delete process.env[key]; else process.env[key] = value;
    }
  });

  it("matches view-composite dependency Compose and actual RPC names", async () => {
    process.env.HOST = "local";
    process.env.NODE_ENV = "local";
    delete process.env.CONTEXT;
    const directory = mkdtempSync(path.join(tmpdir(), "blossm-identity-"));
    const procedureServices = await loadServices(directory, { network: "local" });
    try {
      for (const context of [undefined, "ctx"]) {
        const services = procedureServices({
          config: { testing: { dependencies: [{ procedure: "view-composite", name: "read", context }] } },
          network: "local", env: "test", port: 80,
        });
        const service = Object.values(services).find(value => value.environment?.PROCEDURE == "view-composite");
        assert.equal(service.environment.OPERATION_HASH, operationHash("read", context, "view-composite"));
        let target;
        rpcDeps.get = async url => { target = url; return { statusCode: 200, body: "{}" }; };
        await viewComposite({ name: "read", context }).read({});
        assert.equal(target, `http://${service.container_name}`);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("separates the audited production hostname collision", async () => {
    process.env.HOST = "local";
    process.env.NODE_ENV = "production";
    process.env.GCP_COMPUTE_URL_ID = "compute";
    const tuples = [["ab", "c", "abcdefghijklmnopqr", "command"], ["a", "bc", "abcdefghijklmnopqr", "command"]];
    assert.equal(operationShortName(tuples[0]), operationShortName(tuples[1]));
    const targets = [];
    rpcDeps.post = async url => { targets.push(url); return { statusCode: 204 }; };
    for (const operationNameComponents of tuples) {
      await rpc({ region: "us-central1", operationNameComponents }).post({}).in({}).with();
    }
    assert.notEqual(targets[0], targets[1]);
    tuples.forEach((tuple, i) => assert.equal(targets[i],
      `https://us-central1-${operationShortName(tuple)}-${operationHash(...tuple)}-compute.us-central1.run.app`));
  });

});
