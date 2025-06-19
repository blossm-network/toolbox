import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { restore, useFakeTimers } from "sinon";

import main from "../../main.js";

chai.use(chaiDatetime);
chai.use(sinonChai);
const { expect } = chai;

let clock;
const now = new Date();

describe("Fact unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const query = "some-query";

    const result = await main({ query });
    expect(result).to.deep.be.undefined;
  });
});
