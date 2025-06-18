import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { longDateStringFromTimestamp } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return an expected string based on the utc timestamp", async () => {
    const timestamp = 1559329637;

    expect(longDateStringFromTimestamp(timestamp)).to.equal(
      "May 31st 2019, 7:07:17 pm"
    );
  });
});
