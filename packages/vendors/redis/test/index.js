import assert from "node:assert/strict";
import { stub, replace, restore } from "sinon";
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
});
