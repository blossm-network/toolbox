import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { timestampFromDate } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the date", async () => {
    const timestamp = 1559329637;
    const timestampToMilliseconds = timestamp * 1000;
    const date = new Date(timestampToMilliseconds);
    expect(timestampFromDate(date)).to.equal(timestamp);
  });
});
