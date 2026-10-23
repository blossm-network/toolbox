import assert from "node:assert/strict";
import { stub, replace, restore, useFakeTimers } from "sinon";
import deps from "../deps.js";

const value = { some: "value" };
let sequence = 0;
const load = async () =>
  (await import(`../index.js?test=${sequence++}`)).default;

describe("Redis cache", () => {
  let previous;
  let client;
  beforeEach(() => {
    previous = [process.env.REDIS_HOST, process.env.REDIS_PORT];
    process.env.REDIS_HOST = "unused.invalid";
    process.env.REDIS_PORT = "6379";
    const actualClient = deps.redis.createClient();
    assert.equal(typeof actualClient.HSET, "function");
    client = {
      isReady: true,
      HSET: stub().resolves(),
      HGETALL: stub().resolves(value),
      EXPIRE: stub().resolves(),
      on: stub(),
      connect: stub().resolves(),
    };
    replace(deps, "redis", { createClient: () => client });
  });
  afterEach(() => {
    restore();
    for (const [index, key] of ["REDIS_HOST", "REDIS_PORT"].entries()) {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }
  });
  it("uses the Redis5 hash methods", async () => {
    const cache = await load();
    await cache.writeObject("key", value);
    assert.deepEqual(client.HSET.firstCall.args, ["key", value]);
    assert.equal(await cache.readObject("key"), value);
    await cache.setExpiry("key", { seconds: 2 });
    assert.deepEqual(client.EXPIRE.firstCall.args, ["key", 2]);
  });
  it("expires fallback values without Redis configuration", async () => {
    delete process.env.REDIS_HOST;
    const clock = useFakeTimers({ now: 1000 });
    try {
      const cache = await load();
      await cache.writeObject("key", value);
      await cache.setExpiry("key", { seconds: 2 });
      clock.tick(1999);
      assert.deepEqual(await cache.readObject("key"), value);
      clock.tick(1);
      assert.equal(await cache.readObject("key"), undefined);
    } finally {
      clock.restore();
    }
  });
  it("expires fallback values while Redis is not ready", async () => {
    client.isReady = false;
    const cache = await load();
    await cache.writeObject("key", value);
    await cache.setExpiry("key", { seconds: 0 });
    assert.equal(await cache.readObject("key"), undefined);
    assert.equal(client.EXPIRE.callCount, 0);
  });
  it("preserves TTL on overwrite but starts fresh after expiry", async () => {
    client.isReady = false;
    const clock = useFakeTimers({ now: 1000 });
    try {
      const cache = await load();
      await cache.writeObject("key", value);
      await cache.setExpiry("key", { seconds: 1 });
      await cache.writeObject("key", { changed: "value" });
      clock.tick(1000);
      assert.equal(await cache.readObject("key"), undefined);
      await cache.writeObject("key", value);
      clock.tick(1000);
      assert.deepEqual(await cache.readObject("key"), value);
    } finally {
      clock.restore();
    }
  });
  it("does not revive an expired fallback entry when setting its TTL", async () => {
    client.isReady = false;
    const clock = useFakeTimers({ now: 1000 });
    try {
      const cache = await load();
      await cache.writeObject("key", value);
      await cache.setExpiry("key", { seconds: 1 });
      clock.tick(1000);
      await cache.setExpiry("key", { seconds: 10 });
      assert.equal(await cache.readObject("key"), undefined);
    } finally {
      clock.restore();
    }
  });
});
