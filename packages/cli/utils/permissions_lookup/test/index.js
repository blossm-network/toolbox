import { expect } from "chai";
import { replace, restore } from "sinon";
import redis from "@blossm/redis";
import permissionsLookup from "../index.js";
import factDeps from "../../../../rpc/fact/deps.js";

const principal = { root: "user", service: "core", network: "example.test" };
const contextA = { root: "A", service: "core", network: "example.test" };
const contextB = { ...contextA, root: "B" };
const permission = { service: "core", domain: "document", privilege: "read" };

describe("Contextual permission cache", () => {
  let network;
  let lookup;
  beforeEach(() => {
    network = process.env.NETWORK;
    process.env.NETWORK = "example.test";
    const cache = new Map();
    replace(redis, "readObject", async (key) => cache.get(key));
    replace(redis, "writeObject", async (key, value) => cache.set(key, value));
    replace(redis, "setExpiry", async () => {});
    replace(factDeps, "rpc", ({ operationNameComponents: [name] }) => ({
      get: () => ({
        in: () => ({
          with: async () => ({
            body:
              name === "roles"
                ? [{ id: "reader", subject: contextA }]
                : [permission],
          }),
        }),
      }),
    }));
    lookup = permissionsLookup({ downloadFileFn: async () => {} });
  });
  afterEach(() => {
    restore();
    if (network === undefined) delete process.env.NETWORK;
    else process.env.NETWORK = network;
  });
  it("does not grant A's permissions in B", async () => {
    expect(await lookup({ principal, context: contextA })).to.deep.equal([
      permission,
    ]);
    expect(await lookup({ principal, context: contextB })).to.deep.equal([]);
  });
  it("does not reuse B's missing permissions in A", async () => {
    expect(await lookup({ principal, context: contextB })).to.deep.equal([]);
    expect(await lookup({ principal, context: contextA })).to.deep.equal([
      permission,
    ]);
  });
  it("distinguishes unscoped and scoped permissions", async () => {
    expect(await lookup({ principal })).to.deep.equal([permission]);
    expect(await lookup({ principal, context: contextB })).to.deep.equal([]);
  });
  it("distinguishes the network whose roles are being resolved", async () => {
    expect(await lookup({ principal, context: contextA })).to.deep.equal([
      permission,
    ]);
    process.env.NETWORK = "another.test";
    expect(await lookup({ principal, context: contextA })).to.deep.equal([]);
  });
});
