import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import loadServices from "./load_services.js";
import mainService from "../src/write_compose/main_service.js";

describe("Contextual Compose dependencies", () => {
  let directory;
  let services;
  beforeEach(async () => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-compose-"));
    services = await loadServices(directory);
  });
  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });
  for (const procedure of ["view-store", "view-composite"]) {
    it(`keeps distinct ${procedure} contexts and matches main image naming`, () => {
      const dependencies = ["team", "other", undefined].map((context) => ({
        procedure,
        context,
        name: "summary",
      }));
      const result = services({
        config: { context: "caller", testing: { dependencies } },
        containerRegistery: "registry",
        databaseServiceKey: "db",
        port: 80,
        network: "example.test",
      });
      const peers = Object.values(result).filter(
        (service) => service.environment?.PROCEDURE === procedure,
      );
      assert.equal(peers.length, 3);
      assert.equal(new Set(peers.map((peer) => peer.container_name)).size, 3);
      for (const dependency of dependencies) {
        const peer = peers.find(
          (value) => value.environment.CONTEXT === dependency.context,
        );
        assert.ok(peer);
        assert.equal(
          peer.image,
          mainService({ ...dependency, containerRegistery: "registry" }).image,
        );
      }
    });
  }
  it("keeps a same-name/context store and composite as separate services", () => {
    const dependencies = ["view-store", "view-composite"].map((procedure) => ({
      procedure,
      context: "team",
      name: "summary",
    }));
    const result = services({
      config: { context: "caller", testing: { dependencies } },
      containerRegistery: "registry",
      databaseServiceKey: "db",
      network: "example.test",
      port: 80,
    });
    const peers = Object.entries(result).filter(
      ([, service]) => service.environment?.NAME === "summary",
    );
    assert.equal(peers.length, 2);
    for (const [key, peer] of peers)
      assert.equal(key, peer.environment.OPERATION_HASH);
    assert.equal(new Set(peers.map(([, peer]) => peer.container_name)).size, 2);
  });

  for (const procedure of ["view-store", "view-composite"]) {
    it(`retains registry selection for ${procedure}`, () => {
      const dependencies = ["local.core", "external.test"].map(
        (network, i) => ({
          procedure,
          context: "team",
          name: `summary${i}`,
          network,
        }),
      );
      const result = services({
        config: { context: "caller", testing: { dependencies } },
        containerRegistery: "app-registry",
        baseContainerRegistery: "core-registry",
        localCoreNetwork: "local.core",
        databaseServiceKey: "db",
        network: "example.test",
        port: 80,
      });
      const peers = Object.values(result).filter(
        (service) => service.environment?.PROCEDURE === procedure,
      );
      assert.equal(
        peers.find((peer) => peer.environment.NAME === "summary0").image,
        `core-registry/${procedure}.team.summary0:latest`,
      );
      assert.equal(
        peers.find((peer) => peer.environment.NAME === "summary1").image,
        `app-registry/${procedure}.team.summary1:latest`,
      );
    });
  }
});
