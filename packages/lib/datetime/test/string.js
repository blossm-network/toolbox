const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");

const { string } = require("..");

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
    const nowString = string();

    expect(new Date(Date.parse(nowString))).to.equalDate(now);
  });
});
