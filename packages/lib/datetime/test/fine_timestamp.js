const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");

const { fineTimestamp } = require("../index");

let clock;

const now = new Date();

describe("Creates correctly", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it("it should return a timestamp that equals now", async () => {
    const nowTimestamp = fineTimestamp();

    expect(new Date(nowTimestamp)).to.equalDate(now);
  });
});
