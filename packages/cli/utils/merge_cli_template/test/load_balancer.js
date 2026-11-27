import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { cloudRun } from "../src/deployment_config.js";
import commandGateway from "../src/write_build/command_gateway.js";
import factGateway from "../src/write_build/fact_gateway.js";
import viewGateway from "../src/write_build/view_gateway.js";
import command from "../src/write_build/command.js";
import ensureResource from "../src/write_build/steps/ensure_resource.js";

const loadBalancer = {
  urlMap: "gateways",
  certificateMap: "gateways",
  securityPolicy: "gateways",
  address: "203.0.113.7",
};
const options = {
  strict: true,
  domain: "bird",
  service: "animals",
  context: "dashboard",
  network: "example.com",
  envUriSpecifier: "staging.",
  dnsZone: "zone",
  project: "target",
  region: "us-central1",
  serviceName: "gateway",
  computeUrlId: "1",
  checkInPath: "_check-in",
  checkInSchedule: "* * * * *",
};
// Each gcloud call a build makes, as one line of arguments.
const calls = (steps) =>
  steps
    .flat()
    .filter((step) => step.name == "gcr.io/cloud-builders/gcloud")
    .map(({ args }) =>
      (args[0] == "-c" ? args.slice(args.indexOf("--") + 1) : args).join(" "),
    );
const at = (lines, text) => {
  const index = lines.findIndex((line) => line.includes(text));
  assert.notEqual(index, -1, text);
  return index;
};

describe("Gateways behind a load balancer", () => {
  for (const [name, gateway] of Object.entries({
    commandGateway,
    factGateway,
    viewGateway,
  })) {
    it(`routes a ${name} through the load balancer and nothing else`, () => {
      const lines = calls(gateway({ ...options, cloudRun: { loadBalancer } }));
      const deploy = at(lines, "run deploy gateway");
      // The service refuses requests that did not come through the balancer.
      assert(
        lines[deploy].includes("--ingress=internal-and-cloud-load-balancing"),
      );
      assert(!lines.some((line) => line.includes("domain-mappings")));
      assert(!lines.some((line) => line.includes("ghs.googlehosted.com")));

      const policy = at(
        lines,
        "compute backend-services update gateway --global --security-policy=gateways",
      );
      const route = at(lines, "compute url-maps add-path-matcher gateways");
      // The matcher is looked for by name in the map itself, and the build
      // is told which name: the last argument of that step.
      assert(
        lines[route].includes(
          "compute url-maps describe gateways --global --project=target --format=value(pathMatchers[].name)",
        ),
        lines[route],
      );
      assert(lines[route].endsWith(" gateway"), lines[route]);
      // The policy is on the backend before a hostname can reach it.
      assert(deploy < policy && policy < route);
      assert(
        at(
          lines,
          "--network-endpoint-type=serverless --cloud-run-service=gateway",
        ) <
          at(
            lines,
            "add-backend gateway --global --network-endpoint-group=gateway",
          ),
      );
      const host = /--new-hosts=(\S+)/.exec(lines[route])[1];
      assert.match(host, /\.staging\.example\.com$/);
      assert(lines[route].includes("--default-service=gateway"));
      at(
        lines,
        `certificate-manager certificates create gateway --domains=${host}`,
      );
      at(
        lines,
        `maps entries create gateway --map=gateways --certificates=gateway --hostname=${host}`,
      );
      at(lines, `dns record-sets create ${host}. --zone=zone --type=A`);
      at(lines, "--rrdatas=203.0.113.7");
      for (const line of lines.slice(deploy + 1))
        assert(line.includes("--project=target"), line);
    });

    it(`keeps a ${name} mapped directly without a load balancer`, () => {
      const lines = calls(gateway({ ...options, cloudRun: {} }));
      assert(lines[at(lines, "run deploy gateway")].includes("--ingress=all"));
      at(lines, "run domain-mappings create");
      at(lines, "--type=CNAME");
      assert(!lines.some((line) => /backend-services|url-maps/.test(line)));
    });
  }

  it("leaves an internal service's ingress alone", () => {
    const lines = calls(
      command({ ...options, name: "start", cloudRun: { loadBalancer } }),
    );
    assert(
      lines[at(lines, "run deploy gateway")].includes("--ingress=internal"),
    );
    assert(!lines.some((line) => /backend-services|url-maps/.test(line)));
  });

  it("reads a complete definition and refuses a partial or malformed one", () => {
    const config = (value) => ({
      vendors: { cloud: { gcp: { loadBalancers: { development: value } } } },
    });
    const read = (value, env = "development") =>
      cloudRun({ env, config: config(value) }).loadBalancer;
    assert.deepEqual(read({ ...loadBalancer, extra: 1 }), loadBalancer);
    assert.equal(read(loadBalancer, "production"), undefined);
    assert.equal(read(undefined), undefined);
    for (const [key, value] of [
      ["securityPolicy", undefined],
      ["urlMap", "Bad Name"],
      ["certificateMap", ""],
      ["address", "gateway.example.com"],
      ["address", undefined],
    ])
      assert.throws(
        () => read({ ...loadBalancer, [key]: value }),
        new RegExp(`loadBalancers\\.development\\.${key} must be`),
      );
    assert.throws(() => read("gateways"), /must be a load balancer definition/);
  });

  // A read can succeed without the resource being there.
  it("creates when a successful read lacks the resource, only when asked to", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "blossm-empty-read-"));
    try {
      const gcloud = path.join(fixture, "gcloud");
      writeFileSync(
        gcloud,
        `#!/bin/bash
if [ "$1" = read ]; then printf '%s' "$READ"; exit 0; fi
echo "$1" > "${fixture}/wrote"; exit 0
`,
      );
      chmodSync(gcloud, 0o755);
      const run = (options, READ) => {
        rmSync(path.join(fixture, "wrote"), { force: true });
        const step = ensureResource({
          describe: ["read"],
          create: ["create"],
          ...options,
        });
        const result = spawnSync(
          "/bin/bash",
          step.args.map((arg) => arg.replaceAll("$$", "$")),
          { env: { PATH: `${fixture}:${process.env.PATH}`, READ } },
        );
        assert.equal(result.status, 0, String(result.stderr));
        return spawnSync("cat", [path.join(fixture, "wrote")])
          .stdout.toString()
          .trim();
      };
      assert.equal(run({ emptyIsMissing: true }, ""), "create");
      assert.equal(run({ emptyIsMissing: true }, "found"), "");
      assert.equal(run({}, ""), "");
      // A name is found only whole, among names joined by semicolons.
      for (const [read, wrote] of [
        ["", "create"],
        ["other", "create"],
        ["gateway-two;other", "create"],
        ["a-gateway", "create"],
        ["gateway", ""],
        ["other;gateway", ""],
        ["gateway;other", ""],
      ])
        assert.equal(run({ has: "gateway" }, read), wrote, read);
      // A name is data, never a pattern.
      assert.equal(run({ has: "*" }, "gateway"), "create");
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
