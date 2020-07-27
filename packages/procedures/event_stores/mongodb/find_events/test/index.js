const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const findEvents = require("..");

const deps = require("../deps");

const eventStore = "some-event-store";
const events = "some-events";

describe("Mongodb event store find event store", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns(events);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const query = "some-query";
    const sort = "some-sort";
    const result = await findEvents({ eventStore })({
      query,
      sort,
    });
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query,
      sort,
      limit: 100,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(events);
  });
  it("should call with the correct params with optionals missing", async () => {
    const findFake = fake.returns(events);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const query = "some-query";
    const result = await findEvents({ eventStore })({
      query,
    });
    expect(findFake).to.have.been.calledWith({
      store: eventStore,
      query,
      limit: 100,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(events);
  });
});
