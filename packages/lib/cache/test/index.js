const { expect, fake, replace, restore } = require("chai");

const deps = require("../deps");

const setFake = fake();
const getFake = fake();

replace(deps, "redis", {
  set: setFake,
  get: getFake,
});

const { set, get } = require("..");

describe("Cache", () => {
  afterEach(() => {
    restore();
  });
  it("It should set and get correctly;", async () => {
    const key = "some-key";
    const value = { some: "value" };
    await set(key, value);

    expect(setFake).to.have.been.calledWith(key, value);

    const result = await get(key);
    expect(result).to.equal(value);
  });
});
