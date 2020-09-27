const { expect } = require("chai").use(require("sinon-chai"));
const { fake, stub, replace, restore, match } = require("sinon");

const deps = require("../deps");

process.env.REDIS_IP = "some-cache-ip";

const value = { some: "value" };
const hmsetFake = stub().yields(null);
const hgetallFake = stub().yields(null, value);
const onFake = fake();
const expireFake = stub().yields(null);
const createClientFake = fake.returns({
  hmset: hmsetFake,
  hgetall: hgetallFake,
  expire: expireFake,
  on: onFake,
});

replace(deps, "redis", {
  createClient: createClientFake,
});

const { writeObject, readObject, setExpiry } = require("..");

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
    expect(hgetallFake).to.have.been.calledWith(key);

    const seconds = 2;
    await setExpiry({ key, seconds });
    expect(expireFake).to.have.been.calledWith(key, seconds);
    expect(1).to.equal(1);
  });
});
