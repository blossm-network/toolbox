const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const eventStoreService = require("..");

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

    const query = {
      root,
      domain,
      service
    };

    const response = await eventStoreService.hydrate({ query });

    expect(eventStore).to.have.been.calledWith({ domain, service });
    expect(hydrate).to.have.been.calledWith({ root });
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
    const query = {
      root,
      domain
    };

    expect(async () => await eventStoreService.hydrate({ query })).to.throw;
  });

  it("should call add with the correct params", async () => {
    const add = fake.resolves();
    const eventStore = fake.returns({
      add
    });
    replace(deps, "eventStore", eventStore);

    const event = {
      fact: {
        root: "someRoot",
        topic: "a.topic",
        service: "a-service",
        version: 0,
        commandInstanceId: "someid",
        command: "a.command",
        commandIssuedTimestamp: 123,
        traceId: "a-trace-id",
        createdTimestamp: 10
      },
      payload: {
        a: 3,
        b: 4
      }
    };

    const body = {
      event,
      domain,
      service
    };

    const response = await eventStoreService.add({ body });
    expect(eventStore).to.have.been.calledWith({ domain, service });
    expect(add).to.have.been.calledWith({ event });
    expect(response).to.be.be.undefined;
  });

  it("should reject as expected if add fails", async () => {
    const err = Error();
    const add = fake.rejects(err);
    const eventStore = fake.returns({
      add
    });
    replace(deps, "eventStore", eventStore);

    const event = {
      a: 3,
      b: 4
    };

    const body = {
      event,
      domain,
      service
    };

    expect(async () => await eventStoreService.add({ body })).to.throw;
  });
});
