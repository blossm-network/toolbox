const gcpToken = require("@sustainers/gcp-token");
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

describe("Event handler store unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const createFake = fake.returns({
      in: inFake
    });
    const viewStoreFake = fake.returns({
      create: createFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const name = "some-name";
    const context = "some-context";
    const payload = { name };
    const headers = { context };

    await main({ payload, headers });

    expect(viewStoreFake).to.have.been.calledWith({
      name: targetName,
      domain: targetDomain,
      service,
      network
    });
    expect(createFake).to.have.been.calledWith({
      name
    });
    expect(inFake).to.have.been.calledWith(context);
    expect(withFake).to.have.been.calledWith(gcpToken);
  });
});
