const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const eventStoreHandler = require("..");

const deps = require("../deps");

const storeId = "some-id";
const service = "some-service";

describe("Event store", () => {
  afterEach(() => {
    restore();
  });

  it("should call hydrate with the correct params", async () => {
    const result = "random";
    const hydrate = fake.resolves(result);
    const store = fake.returns({
      hydrate
    });
    replace(deps, "eventStore", store);

    const root = "love!";

    const query = {
      root,
      storeId,
      service
    };

    const response = await eventStoreHandler.hydrate({ query });

    expect(store).to.have.been.calledWith({ storeId, service });
    expect(hydrate).to.have.been.calledWith({ root });
    expect(response).to.equal(result);
  });

  it("should reject as expected if hydrate fails", async () => {
    const err = Error();
    const hydrate = fake.rejects(err);
    const store = fake.returns({
      hydrate
    });
    replace(deps, "eventStore", store);

    const root = "love!";
    const query = {
      root,
      storeId
    };

    expect(async () => await eventStoreHandler.hydrate({ query })).to.throw;
  });

  it("should call add with the correct params", async () => {
    const add = fake.resolves();
    const store = fake.returns({
      add
    });
    replace(deps, "eventStore", store);

    const event = {
      fact: {
        root: "someRoot",
        topic: "a.topic",
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
      storeId,
      service
    };

    const response = await eventStoreHandler.add({ body });
    expect(store).to.have.been.calledWith({ storeId, service });
    expect(add).to.have.been.calledWith({ event });
    expect(response).to.be.be.undefined;
  });

  it("should reject as expected if add fails", async () => {
    const err = Error();
    const add = fake.rejects(err);
    const store = fake.returns({
      add
    });
    replace(deps, "eventStore", store);

    const event = {
      a: 3,
      b: 4
    };

    const body = {
      event,
      storeId,
      service
    };

    expect(async () => await eventStoreHandler.add({ body })).to.throw;
  });
});
