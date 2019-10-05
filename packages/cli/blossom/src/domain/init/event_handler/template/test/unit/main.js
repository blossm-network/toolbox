const gcpToken = require("@sustainers/gcpToken");
const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const deps = require("../../deps");
const main = require("../../main");

let clock;
const now = new Date();

const targetId = "some-target-id";
const targetDomain = "some-target-domain";
const service = "some-service";
const network = "some-network";

process.env.TARGET_ID = targetId;
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
    const createFake = fake.returns({
      with: withFake
    });
    const viewStoreFake = fake.returns({
      create: createFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const name = "some-name";
    const payload = { name };

    await main({ payload });
    expect(viewStoreFake).to.have.been.calledWith({
      id: targetId,
      domain: targetDomain,
      service,
      network
    });
    expect(createFake).to.have.been.calledWith({
      name
    });
    expect(withFake).to.have.been.calledWith(gcpToken);
  });
});
