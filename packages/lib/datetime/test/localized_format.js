const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");

const { localizedFormat } = require("..");

let clock;

const now = new Date();

describe("Creates correctly", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it("it should return the correct formatted timestamp in dst", async () => {
    const now = "2020-06-12T05:40:03.995Z";
    const formatted = localizedFormat(now, 300);

    expect(formatted).to.equal("2020-06-12T09:40:03+05:00");
  });
  it("it should return the correct formatted timestamp outside of dst", async () => {
    const now = "2020-11-12T05:40:03.995Z";
    const formatted = localizedFormat(now, 300);

    expect(formatted).to.equal("2020-11-12T10:40:03+05:00");
  });
});
