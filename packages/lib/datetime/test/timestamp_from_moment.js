import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";
import moment from "moment";

import { timestampFromMoment } from "../index.js";

chai.use(chaiDatetime);

const { utc } = moment;

describe("Converts correctly", () => {
  it("it should return a timestamp used to create the moment", async () => {
    const timestamp = 1559329637;
    const timestampToMilliseconds = timestamp * 1000;
    const moment = utc(timestampToMilliseconds);
    expect(timestampFromMoment(moment)).to.equal(timestamp);
  });
});
