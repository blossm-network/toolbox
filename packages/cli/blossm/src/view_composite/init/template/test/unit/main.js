import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { fake, restore, useFakeTimers } from "sinon";

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

    const viewsFn = fake.resolves([]);
    const result = await main({ query, viewsFn });
    expect(viewsFn).to.have.been.calledOnceWithExactly({
      name: "some-view-store-name",
      context: "some-view-store-context",
      query: { some: "query" },
      sort: { some: 1 },
    });
    expect(result).to.deep.equal({ some: "response" });
  });
});
