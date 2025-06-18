import { expect } from "chai";

import { fineTimestampFromDate } from "../index.js";

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the date", async () => {
    const timestamp = 1559329637345;
    const date = new Date(timestamp);
    expect(fineTimestampFromDate(date)).to.equal(timestamp);
  });
});
