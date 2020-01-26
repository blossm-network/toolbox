const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const root = "some-root";

describe("Command handler unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const aggregateFake = fake.returns({ aggregate: { terminated: false } });
    const result = await main({
      root,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          root,
          payload: {
            loggedout: deps.stringDate()
          }
        }
      ]
    });
  });
  it("should throw correctly if aggregate has already been terminated", async () => {
    const aggregateFake = fake.returns({ aggregate: { terminated: true } });
    const error = "some-error";
    const sessionAlreadyTerminatedFake = fake.returns(error);
    replace(deps, "badRequestError", {
      sessionAlreadyTerminated: sessionAlreadyTerminatedFake
    });
    try {
      await main({ root, aggregateFn: aggregateFake });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const aggregateFake = fake.rejects(errorMessage);
    try {
      await main({ root, aggregateFn: aggregateFake });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
