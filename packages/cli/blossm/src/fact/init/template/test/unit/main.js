import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { fake, replace, restore, useFakeTimers } from "sinon";

import main from "../../main.js";
import deps from "../../deps.js";

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

    const aggregate = fake.resolves({ state: {} });
    const set = fake.returns({ aggregate });
    const eventStore = fake.returns({ set });
    replace(deps, "eventStore", eventStore);
    const result = await main({ query });
    expect(eventStore).to.have.been.calledOnceWithExactly({
      domain: "some-domain",
      service: "some-service",
    });
    expect(set).to.have.been.calledOnceWithExactly({
      token: { internalFn: deps.gcpToken },
    });
    expect(aggregate).to.have.been.calledOnceWithExactly("some-root");
    expect(result).to.deep.equal({ response: { some: "response " } });
  });
});
