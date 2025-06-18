import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { timestampFromComponents } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return the correct timestamp", async () => {
    const time = 400;
    const day = 1;
    const month = 0;
    const year = 1970;

    const components = {
      time,
      day,
      month,
      year,
    };

    expect(timestampFromComponents(components)).to.equal(time);
  });
});
