const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const hydrateFromEventStore = require("..");

const deps = require("../deps");

const domain = "some-domain";
const service = "some-service";

describe("Event store", () => {
  afterEach(() => {
    restore();
  });

  it("should call hydrate with the correct params", async () => {
    const result = "random";
    const hydrate = fake.resolves(result);
    const eventStore = fake.returns({
      hydrate
    });
    replace(deps, "eventStore", eventStore);

    const root = "love!";

    const params = {
      root,
      domain,
      service
    };

    const response = await hydrateFromEventStore({ params });

    expect(eventStore).to.have.been.calledWith({ domain, service });
    expect(hydrate).to.have.been.calledWith(root);
    expect(response).to.equal(result);
  });

  it("should reject as expected if hydrate fails", async () => {
    const err = Error();
    const hydrate = fake.rejects(err);
    const eventStore = fake.returns({
      hydrate
    });
    replace(deps, "eventStore", eventStore);

    const root = "love!";
    const params = {
      root,
      domain
    };

    expect(async () => await hydrateFromEventStore({ params })).to.throw;
  });
});
