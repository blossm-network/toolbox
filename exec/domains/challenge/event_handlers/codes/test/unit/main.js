const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const deps = require("../../deps");
const main = require("../../main");

let clock;
const now = new Date();

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

    const code = "some-code";
    const context = "some-context";
    const root = "some-root";
    const expires = 180;
    const payload = { code, expires };
    const headers = { root, context };

    await main({ payload, headers });

    expect(viewStoreFake).to.have.been.calledWith({
      name: "codes",
      domain: "challenge"
    });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(updateFake).to.have.been.calledWith(root, {
      code,
      expires: deps.stringFromDate(
        deps
          .moment()
          .add(3, "m")
          .toDate()
      )
    });
  });
});
