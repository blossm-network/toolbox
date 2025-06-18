import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { weekdayDateStringFromTimestamp } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return an expected string based on the utc timestamp", async () => {
    const timestamp = 1559329637;

    expect(weekdayDateStringFromTimestamp(timestamp)).to.equal(
      "Friday, May 31st"
    );
  });
});
