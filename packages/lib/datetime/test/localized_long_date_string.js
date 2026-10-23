import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { expect } from "chai";

import { localizedLongDateString } from "../index.js";

chai.use(chaiDatetime);
chai.use(sinonChai);

describe("Converts correctly", () => {
  it("it should return an expected string based on the utc timestamp", async () => {
    const string = "2019-05-31T19:07:17+00:00";

    expect(localizedLongDateString(string, -300)).to.equal(
      "May 31st 2019, 2:07:17 pm"
    );
  });
});

describe("Explicit long-date offsets", () => {
  it("does not infer daylight saving from another region", () => {
    expect(localizedLongDateString("2025-06-01T12:00:00Z", 0)).to.equal(
      "June 1st 2025, 12:00:00 pm"
    );
  });
});
