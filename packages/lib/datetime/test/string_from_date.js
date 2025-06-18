import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";

import { stringFromDate } from "../index.js";

chai.use(chaiDatetime);

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the date", async () => {
    const string = "1995-12-04T00:12:00.000Z";
    const date = new Date(Date.parse(string));
    expect(stringFromDate(date)).to.equal(string);
  });
});
