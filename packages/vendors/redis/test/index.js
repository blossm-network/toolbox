const { expect } = require("chai").use(require("sinon-chai"));
const { fake, stub, replace, restore, match } = require("sinon");

const deps = require("../deps");

process.env.REDIS_IP = "some-cache-ip";

const value = { some: "value" };
const hmsetFake = stub().yields(null);
const hgetallFake = stub().yields(null, value);
const onFake = fake();
const createClientFake = fake.returns({
  hmset: hmsetFake,
  hgetall: hgetallFake,
  on: onFake,
});

replace(deps, "redis", {
  createClient: createClientFake,
});

const { writeObject, readObject, setExpiry } = require("..");

//TODO improve this test
describe("Cache", () => {
  afterEach(() => {
    restore();
  });
  it("It should read and write correctly;", async () => {
    const key = "some-key";
    await writeObject(key, value);

    expect(hmsetFake).to.have.been.calledWith(
      key,
      value,
      match(() => true)
    );

    const result = await readObject(key);
    expect(result).to.equal(value);

    await setExpiry(key);
    expect(1).to.equal(1);
  });
});
