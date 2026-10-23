import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import operationHash from "@blossm/operation-hash";
import rootDir from "@blossm/cli-root-dir";
import rpc from "@blossm/rpc";
import operationShortName from "@blossm/operation-short-name";
import viewComposite from "@blossm/view-composite-rpc";
import rpcDeps from "@blossm/rpc/deps.js";
import procedureServices from "../src/write_compose/procedure_services.js";

const previous = Object.fromEntries(["OPERATION_IDENTITY_VERSION", "HOST", "NODE_ENV", "CONTEXT", "GCP_COMPUTE_URL_ID"].map(key => [key, process.env[key]]));

describe("Generated operation identity", () => {
  const originalRoot = rootDir.path;
  const originalGet = rpcDeps.get;
  const originalPost = rpcDeps.post;
  afterEach(() => {
    rootDir.path = originalRoot;
    rpcDeps.get = originalGet;
    rpcDeps.post = originalPost;
    for (const [key, value] of Object.entries(previous)) {
      if (value == undefined) delete process.env[key]; else process.env[key] = value;
    }
  });

  for (const version of ["1", "2"]) it(`matches dependency Compose and actual RPC names, version ${version}`, async () => {
    process.env.OPERATION_IDENTITY_VERSION = version;
    process.env.HOST = "local";
    process.env.NODE_ENV = "local";
    delete process.env.CONTEXT;
    const directory = mkdtempSync(path.join(tmpdir(), "blossm-identity-"));
    rootDir.path = () => directory;
    try {
      for (const context of [undefined, "ctx"]) {
        const services = procedureServices({
          config: { testing: { dependencies: [{ procedure: "view-composite", name: "read", context }] } },
          network: "local", env: "test", port: 80,
        });
        const service = Object.values(services).find(value => value.environment?.PROCEDURE == "view-composite");
        assert.equal(service.environment.OPERATION_IDENTITY_VERSION, version);
        assert.equal(service.environment.OPERATION_HASH, operationHash("read", context, "view-composite"));
        let target;
        rpcDeps.get = async url => { target = url; return { statusCode: 200, body: "{}" }; };
        await viewComposite({ name: "read", context }).read({});
        assert.equal(target, `http://${service.container_name}`);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("keeps dependency runtime selection consistent when custom env conflicts", () => {
    process.env.OPERATION_IDENTITY_VERSION = "2";
    const directory = mkdtempSync(path.join(tmpdir(), "blossm-identity-"));
    rootDir.path = () => directory;
    try {
      writeFileSync(path.join(directory, "blossm.yaml"), JSON.stringify({
        procedure: "command", name: "set", domain: "d", service: "s",
        env: { test: { OPERATION_IDENTITY_VERSION: "1" } },
      }));
      const services = procedureServices({
        config: { testing: { dependencies: [{ procedure: "command", name: "set", domain: "d", service: "s" }] } },
        network: "local", env: "test", port: 80,
      });
      const service = Object.values(services).find(value => value.environment?.PROCEDURE == "command");
      assert.equal(service.environment.OPERATION_IDENTITY_VERSION, "2");
      assert.equal(service.environment.OPERATION_HASH, operationHash("set", "d", "s", "command"));
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it("separates the audited production hostname collision", async () => {
    process.env.OPERATION_IDENTITY_VERSION = "2";
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
