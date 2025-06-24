import * as chai from "chai";
import sinonChai from "sinon-chai";
import {  stub, replace, restore } from "sinon";
import deps from "../deps.js";

process.env.REDIS_IP = "some-redis-ip";

chai.use(sinonChai);
const { expect } = chai;

const value = { some: "value" };

describe("Cache", () => {
  let mockClient;

  beforeEach(() => {
    // Create a mock Redis client
    mockClient = {
      hmset: stub().resolves(),
      hgetall: stub().resolves(value),
      expire: stub().resolves(),
      on: stub(),
      connect: stub().resolves()
    };

    // Stub the createClient function to return our mock
    replace(deps, "redis", {
        createClient: stub().returns(mockClient)
    });
  });

  afterEach(() => {
    restore();
  });

  it("should read and write correctly", async () => {
    // Now import the module that will use our stubbed client
    const { writeObject, readObject, setExpiry } = await import("../index.js");

    const key = "some-key";
    await writeObject(key, value);

    expect(mockClient.hmset).to.have.been.calledWith(key, value);

    const result = await readObject(key);
    expect(result).to.equal(value);
    expect(mockClient.hgetall).to.have.been.calledWith(key);

    const seconds = 2;
    await setExpiry(key, { seconds });
    expect(mockClient.expire).to.have.been.calledWith(key, seconds);
  });
});
