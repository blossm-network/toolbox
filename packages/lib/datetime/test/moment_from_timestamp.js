import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { momentFromTimestamp } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return a moment with the same timestamp used to create it", async () => {
    const timestamp = 1559329637;
    const moment = momentFromTimestamp(timestamp);
    const timestampToMilliseconds = timestamp * 1000;
    expect(moment.utc().valueOf()).to.equal(timestampToMilliseconds);
  });
});
