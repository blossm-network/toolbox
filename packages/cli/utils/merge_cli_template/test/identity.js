import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import operationHash from "@blossm/operation-hash";
import rpc from "@blossm/rpc";
import operationShortName from "@blossm/operation-short-name";
import viewComposite from "@blossm/view-composite-rpc";
import rpcDeps from "@blossm/rpc/deps.js";
import loadServices from "./load_services.js";
import compositeBuild from "../src/write_build/view_composite.js";

const mergerSource = readFileSync(
  new URL("../index.js", import.meta.url),
  "utf8",
);
const writeConfig = new Function(
  "hash",
  "path",
  "fs",
  "resolveTransientInfo",
  mergerSource.slice(
    mergerSource.indexOf("const topicsForDependencies ="),
    mergerSource.indexOf("const writePackage ="),
  ) + "; return writeConfig;",
)(operationHash, path, { writeFileSync }, (dependencies) => ({
  dependencies,
  events: [],
}));

const previous = Object.fromEntries(
  ["HOST", "NODE_ENV", "CONTEXT", "GCP_COMPUTE_URL_ID"].map((key) => [
    key,
    process.env[key],
  ]),
);

describe("Generated operation identity", () => {
  const originalGet = rpcDeps.get;
  const originalPost = rpcDeps.post;
  afterEach(() => {
    rpcDeps.get = originalGet;
    rpcDeps.post = originalPost;
    for (const [key, value] of Object.entries(previous)) {
      if (value == undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("matches view-composite dependency Compose and actual RPC names", async () => {
    process.env.HOST = "local";
    process.env.NODE_ENV = "local";
    delete process.env.CONTEXT;
    const directory = mkdtempSync(path.join(tmpdir(), "blossm-identity-"));
    const procedureServices = await loadServices(directory, {
      network: "local",
    });
    try {
      for (const context of [undefined, "ctx"]) {
        const services = procedureServices({
          config: {
            testing: {
              dependencies: [
                { procedure: "view-composite", name: "read", context },
              ],
            },
          },
          network: "local",
          env: "test",
          port: 80,
        });
        const service = Object.values(services).find(
          (value) => value.environment?.PROCEDURE == "view-composite",
        );
        assert.equal(
          service.environment.OPERATION_HASH,
          operationHash("read", context, "view-composite"),
        );
        writeConfig({
          config: {
            procedure: "view-composite",
            testing: {
              dependencies: [
                {
                  procedure: "view-composite",
                  name: "read",
                  context,
                  mocks: [],
                },
              ],
            },
          },
          localNetwork: "local",
          localCoreNetwork: "core",
          workingDir: directory,
        });
        const config = JSON.parse(
          readFileSync(path.join(directory, "config.json"), "utf8"),
        );
        assert.equal(
          config.testing.dependencies[0].host,
          service.container_name,
        );
        let target;
        rpcDeps.get = async (url) => {
          target = url;
          return { statusCode: 200, body: "{}" };
        };
        await viewComposite({ name: "read", context }).read({});
        assert.equal(target, `http://${service.container_name}`);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("preserves absent context in generated local and remote environments", () => {
    for (const context of [undefined, "ctx"]) {
      const steps = compositeBuild({
        name: "read",
        context,
        procedure: "view-composite",
        strict: true,
      }).flat();
      const envStep = steps.find((step) => step.entrypoint == "node");
      const localEnv = Buffer.from(envStep.args.at(-1), "base64").toString();
      const deploy = steps.find((step) => step.args?.includes("deploy"));
      const prepare = steps[steps.indexOf(deploy) - 1];
      const remoteEnv = JSON.parse(
        Buffer.from(prepare.args.at(-1), "base64").toString(),
      );
      const labels = deploy.args.find((arg) => arg.startsWith("--labels="));
      if (context === undefined) {
        assert.equal(localEnv.includes("CONTEXT="), false);
        assert.equal(Object.hasOwn(remoteEnv, "CONTEXT"), false);
        assert.equal(labels.includes("context="), false);
      } else {
        assert.ok(localEnv.includes("CONTEXT=ctx\n"));
        assert.equal(remoteEnv.CONTEXT, "ctx");
        assert.ok(labels.includes("context=ctx,"));
      }
    }
  });

  it("separates the audited production hostname collision", async () => {
    process.env.HOST = "local";
    process.env.NODE_ENV = "production";
    process.env.GCP_COMPUTE_URL_ID = "compute";
    const tuples = [
      ["ab", "c", "abcdefghijklmnopqr", "command"],
      ["a", "bc", "abcdefghijklmnopqr", "command"],
    ];
    assert.equal(operationShortName(tuples[0]), operationShortName(tuples[1]));
    const targets = [];
    rpcDeps.post = async (url) => {
      targets.push(url);
      return { statusCode: 204 };
    };
    for (const operationNameComponents of tuples) {
      await rpc({ region: "us-central1", operationNameComponents })
        .post({})
        .in({})
        .with();
    }
    assert.notEqual(targets[0], targets[1]);
    tuples.forEach((tuple, i) =>
      assert.equal(
        targets[i],
        `https://us-central1-${operationShortName(tuple)}-${operationHash(...tuple)}-compute.us-central1.run.app`,
      ),
    );
  });
});
