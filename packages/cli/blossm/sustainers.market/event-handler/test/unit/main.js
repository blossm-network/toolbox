const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, useFakeTimers } = require("sinon");

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
    const name = "some-name";
    const context = "some-context";
    const root = "some-root";
    const payload = { name };
    const headers = { root, context };

    await main({ payload, headers });

    expect(1).to.equal(1);
  });
});
