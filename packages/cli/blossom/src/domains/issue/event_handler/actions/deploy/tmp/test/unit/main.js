const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const deps = require("../../deps");
const main = require("../../main");

let clock;
const now = new Date();

const targetName = "some-target-name";
const targetDomain = "some-target-domain";
const service = "some-service";
const network = "some-network";

process.env.TARGET_NAME = targetName;
process.env.TARGET_DOMAIN = targetDomain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Event handler unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const updateFake = fake();
    const setFake = fake.returns({
      update: updateFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const name = "some-name";
    const context = "some-context";
    const root = "some-root";
    const payload = { name };
    const headers = { root, context };

    await main({ payload, headers });

    expect(viewStoreFake).to.have.been.calledWith({
      name: targetName,
      domain: targetDomain,
      service,
      network
    });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(updateFake).to.have.been.calledWith(root, {
      name
    });
  });
});
