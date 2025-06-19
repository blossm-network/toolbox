import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { restore, useFakeTimers } from "sinon";

import main from "../../main.js";

const { expect } = chai;

chai.use(chaiDatetime);
chai.use(sinonChai);

let clock;
const now = new Date();

describe("Composite unit tests", () => {
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
    expect(result).to.deep.equal({ some: "response" });
  });
});
