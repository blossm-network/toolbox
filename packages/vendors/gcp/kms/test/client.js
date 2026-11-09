import { expect } from "chai";
import { execFileSync } from "node:child_process";

const run = (source) =>
  execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8",
    env: { NODE_ENV: "local" },
    timeout: 10000,
  });
const entry = new URL("../index.js", import.meta.url).href;
const dependency = new URL("../deps.js", import.meta.url).href;

describe("KMS client initialization", function () {
  this.timeout(15000);
  it("imports without discovering credentials", () => {
    run(`
      import assert from "node:assert/strict";
      import http from "node:http";
      import https from "node:https";
      import net from "node:net";
      import { syncBuiltinESMExports } from "node:module";
      let requests = 0;
      const deny = () => { requests++; throw new Error("Import must stay offline"); };
      http.request = https.request = net.Socket.prototype.connect = deny;
      globalThis.fetch = deny;
      syncBuiltinESMExports();
      await import(${JSON.stringify(entry)});
      await new Promise(setImmediate);
      assert.equal(requests, 0);
    `);
  });

  it("creates one client on first use and retains its receiver", () => {
    const result = run(`
      const {default: deps} = await import(${JSON.stringify(dependency)});
      let constructions = 0;
      deps.Client = class {
        constructor() { constructions++; this.marker = "client"; }
        cryptoKeyPath() { return this.marker; }
      };
      const {default: kms} = await import(${JSON.stringify(entry)});
      const before = constructions;
      const client = kms.__client;
      console.log(JSON.stringify({before, after: constructions, same: kms.__client === client, marker: client.cryptoKeyPath()}));
    `);
    expect(JSON.parse(result)).to.deep.equal({
      before: 0,
      after: 1,
      same: true,
      marker: "client",
    });
  });

  it("verifies through the lazy client before accessing its public getter", () => {
    run(`
      import assert from "node:assert/strict";
      const {default: deps} = await import(${JSON.stringify(dependency)});
      let constructions = 0;
      let retrievals = 0;
      deps.Client = class {
        constructor() { constructions++; this.marker = "client"; }
        cryptoKeyVersionPath(...parts) {
          assert.equal(this.marker, "client");
          assert.deepEqual(parts, ["project", "global", "ring", "key", "2"]);
          return parts.join("/");
        }
        async getPublicKey({name}) {
          assert.equal(name, "project/global/ring/key/2");
          retrievals++;
          return [{pem: "public-key"}];
        }
      };
      deps.crypto = {createVerify: () => ({update: () => ({verify: () => true})})};
      const {default: kms} = await import(${JSON.stringify(entry)});
      assert.equal(constructions, 0);
      const verify = kms.verify({project: "project", location: "global", ring: "ring", key: "key", version: "2"});
      assert.equal(await verify({message: "message", signature: "signature"}), true);
      assert.equal(await verify({message: "message", signature: "signature"}), true);
      assert.equal(constructions, 1);
      assert.equal(retrievals, 1);
    `);
  });
});
