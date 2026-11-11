import assert from "node:assert/strict";
import fsExtra from "fs-extra";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import loadServices from "./load_services.js";

describe("Dependency configuration discovery", () => {
  let directory;
  const config = (folder, values) => {
    mkdirSync(path.join(directory, folder), { recursive: true });
    writeFileSync(
      path.join(directory, folder, "blossm.yaml"),
      JSON.stringify(values),
    );
  };
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-environments-"));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  it("matches full procedure identity and skips installed trees and symlink cycles", async () => {
    const base = {
      procedure: "fact",
      name: "summary",
      domain: "records",
      service: "core",
    };
    config("a", {
      ...base,
      context: "other",
      env: { testing: { PEER: "wrong-context" } },
    });
    config("b", {
      ...base,
      context: "team",
      network: "other.test",
      env: { testing: { PEER: "wrong-network" } },
    });
    config("c", {
      ...base,
      context: "team",
      env: { testing: { PEER: "correct" } },
    });
    config("node_modules/ignored", {
      ...base,
      context: "team",
      env: { testing: { PEER: "installed" } },
    });
    symlinkSync(directory, path.join(directory, "cycle"), "dir");
    const services = await loadServices(directory);
    const result = services({
      config: { testing: { dependencies: [{ ...base, context: "team" }] } },
      env: "testing",
      network: "example.test",
      containerRegistery: "registry",
    });
    assert.equal(Object.values(result)[0].environment.PEER, "correct");
  });
  it("rejects ambiguous duplicate procedure identities", async () => {
    const dependency = {
      procedure: "fact",
      name: "summary",
      domain: "records",
      service: "core",
    };
    config("first", { ...dependency, env: { testing: { PEER: "first" } } });
    config("second", {
      ...dependency,
      network: "example.test",
      env: { testing: { PEER: "second" } },
    });
    const services = await loadServices(directory);
    assert.throws(
      () =>
        services({
          config: { testing: { dependencies: [dependency] } },
          env: "testing",
          network: "example.test",
          containerRegistery: "registry",
        }),
      /Ambiguous dependency procedure configuration/,
    );
  });
  const base = {
    procedure: "fact",
    name: "summary",
    domain: "records",
    service: "core",
  };
  const generate = (services, dependencies, overrides = {}) =>
    services({
      config: { testing: { dependencies } },
      env: "testing",
      network: "local.network",
      localCoreNetwork: "local.core.network",
      containerRegistery: "registry",
      port: 80,
      ...overrides,
    });
  it("matches real inherited networks and their runtime aliases", async () => {
    config("app", { ...base, env: { testing: { PEER: "app" } } });
    config("core", {
      ...base,
      network: "core.test",
      env: { testing: { PEER: "core" } },
    });
    const services = await loadServices(directory, {
      network: "app.test",
      core: { network: "core.test" },
    });
    for (const network of [
      undefined,
      "app.test",
      "local.network",
      "core.test",
      "local.core.network",
    ]) {
      const result = generate(services, [
        { ...base, ...(network && { network }) },
      ]);
      assert.equal(
        Object.values(result)[0].environment.PEER,
        network?.includes("core") ? "core" : "app",
      );
    }
  });
  it("does not bind a separate core dependency to implicit workspace source", async () => {
    config("app", { ...base, env: { testing: { PEER: "app" } } });
    const services = await loadServices(directory, {
      network: "app.test",
      core: { network: "core.test" },
    });
    const result = generate(services, [
      { ...base, network: "local.core.network" },
    ]);
    assert.equal(Object.values(result)[0].environment.PEER, undefined);
  });
  it("does not index another nested workspace as part of this one", async () => {
    config("a-nested/procedure", {
      ...base,
      env: { testing: { PEER: "nested" } },
    });
    writeFileSync(
      path.join(directory, "a-nested/config.yaml"),
      "network: nested.test",
    );
    config("z-local", { ...base, env: { testing: { PEER: "local" } } });
    const services = await loadServices(directory);
    assert.equal(
      Object.values(generate(services, [base]))[0].environment.PEER,
      "local",
    );
  });
  it("finds legitimate procedures named build and dist", async () => {
    const dependencies = ["build", "dist"].map((name) => ({
      ...base,
      procedure: "command",
      name,
    }));
    for (const dependency of dependencies)
      config(`commands/${dependency.name}`, {
        ...dependency,
        env: { testing: { PEER: dependency.name } },
      });
    const services = await loadServices(directory);
    const peers = Object.values(generate(services, dependencies));
    assert.deepEqual(
      peers.map((peer) => peer.environment.PEER),
      ["build", "dist"],
    );
  });
  it("ignores empty and non-procedure YAML records", async () => {
    config("a-empty", null);
    config("b-other", { documentation: true });
    config("c-valid", { ...base, env: { testing: { PEER: "valid" } } });
    const services = await loadServices(directory);
    assert.equal(
      Object.values(generate(services, [base]))[0].environment.PEER,
      "valid",
    );
  });
  it("identifies a malformed YAML source in its error", async () => {
    mkdirSync(path.join(directory, "broken"));
    writeFileSync(path.join(directory, "broken/blossm.yaml"), "[unfinished");
    const services = await loadServices(directory);
    assert.throws(
      () => generate(services, [base]),
      (error) => error.message.includes("broken/blossm.yaml") && !!error.cause,
    );
  });
  it("does not scan source for HTTP-only mocks", async () => {
    const services = await loadServices(path.join(directory, "absent"));
    assert.doesNotThrow(() =>
      generate(services, [{ procedure: "http", host: "mock", mocks: [] }]),
    );
  });
  it("walks each source directory once for multiple dependencies", async () => {
    const dependencies = ["first", "second"].map((name) => ({ ...base, name }));
    for (const dependency of dependencies)
      config(dependency.name, {
        ...dependency,
        env: { testing: { PEER: dependency.name } },
      });
    const services = await loadServices(directory);
    const original = fsExtra.readdirSync;
    const visits = [];
    fsExtra.readdirSync = (directory, ...args) => {
      visits.push(directory);
      return original(directory, ...args);
    };
    try {
      generate(services, dependencies);
      assert.equal(visits.length, 3);
      assert.equal(new Set(visits).size, 3);
    } finally {
      fsExtra.readdirSync = original;
    }
  });
});
