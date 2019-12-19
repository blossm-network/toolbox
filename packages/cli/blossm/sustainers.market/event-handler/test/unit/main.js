const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const deps = require("../../deps");
const main = require("../../main");

let clock;
const now = new Date();

const service = "some-service";
const network = "some-network";

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
      name: "some-name",
      domain: "some-domain"
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
