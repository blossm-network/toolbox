const { expect } = require("chai").use(require("sinon-chai"));
const { fake, stub, replace, restore } = require("sinon");

const deps = require("../deps");

process.env.CACHE_IP = "some-cache-ip";

const value = { some: "value" };
const setFake = fake();
const getFake = stub().yields(null, value);
const onFake = fake();
const createClientFake = fake.returns({
  on: onFake,
  set: setFake,
  get: getFake,
});

replace(deps, "redis", {
  createClient: createClientFake,
});

const { set, get } = require("..");

describe("Cache", () => {
  afterEach(() => {
    restore();
  });
  it("It should set and get correctly;", async () => {
    const key = "some-key";
    await set(key, value);

    expect(setFake).to.have.been.calledWith(key, value);

    const result = await get(key);
    expect(result).to.equal(value);
  });
});
