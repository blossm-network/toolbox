const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, useFakeTimers } = require("sinon");

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
    const code = "some-code";
    const expires = 180;
    const payload = { code, expires };

    const result = await main({ payload });

    expect(result).to.deep.equal({
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
