import Moment from "moment";
import { expect } from "chai";

import { copyMoment } from "../index.js";

describe("Creates correctly", () => {
  it("it should create a new moment that equals the passed in moment", async () => {
    const moment = Moment();
    const copy = copyMoment(moment);

    expect(moment.utc().valueOf()).to.equal(copy.utc().valueOf());
  });
  it("it should edit the copy moment without affecting the first moment", async () => {
    const moment = Moment();
    const copy = copyMoment(moment);
    copy.add(1, "week");

    expect(moment.utc().valueOf()).to.not.equal(copy.utc().valueOf());
  });
});
