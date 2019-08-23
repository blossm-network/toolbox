const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const addToEventStore = require("..");

const deps = require("../deps");

const domain = "some-domain";
const service = "some-service";

describe("Event store", () => {
  afterEach(() => {
    restore();
  });

  it("should call add with the correct params", async () => {
    const add = fake.resolves();
    const eventStore = fake.returns({
      add
    });
    replace(deps, "eventStore", eventStore);
    replace(deps.eventBus, "publish", fake());

    const event = {
      fact: {
        root: "someRoot",
        topic: "a.topic",
        service: "a-service",
        version: 0,
        command: {
          id: "someId",
          action: "some-action",
          domain: "some-domain",
          service: "some-service",
          issuedTimestamp: 123
        },
        traceId: "a-trace-id",
        createdTimestamp: 10
      },
      payload: {
        a: 3,
        b: 4
      }
    };

    const params = {
      event,
      domain,
      service
    };

    const response = await addToEventStore({ params });
    expect(eventStore).to.have.been.calledWith({ domain, service });
    expect(add).to.have.been.calledWith(event);
    expect(deps.eventBus.publish).to.have.been.calledWith(event);
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

    const params = {
      event,
      domain,
      service
    };

    expect(async () => await addToEventStore({ params })).to.throw;
  });
});
