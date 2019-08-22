const { expect } = require("chai");
const { useFakeTimers } = require("sinon");

const { moment } = require("..");

let clock;

const now = new Date();

describe("Creates correctly", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it("it should return a moment that equals now", async () => {
    const nowTimestamp = now.getTime();

    expect(
      moment()
        .utc()
        .valueOf()
    ).to.equal(nowTimestamp);
  });
});
