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

    expect(localizedLongDateString(string, -360)).to.equal(
      "May 31st 2019, 2:07:17 pm"
    );
  });
});
