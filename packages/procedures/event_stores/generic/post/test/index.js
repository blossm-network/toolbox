const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const root = "some-root";
const domain = "some-domain";
const service = "some-service";

const topic = `did-something.${domain}.${service}`;
const idempotency = "some-idempotency";

const event = {
  headers: {
    b: 2,
    root,
    topic,
    idempotency
  },
  a: 1
};
const lastEventNumber = 4;
const aggregate = { headers: { lastEventNumber } };

process.env.DOMAIN = domain;
process.env.SERVICE = service;

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      saveEventFn: saveEventFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventFnFake).to.have.been.calledWith({
      id: `${root}_${lastEventNumber + 1}`,
      saved: deps.dateString(),
      a: 1,
      headers: {
        b: 2,
        root,
        number: lastEventNumber + 1,
        topic,
        idempotency
      }
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvent);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with default idempotency", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake.returns(aggregate);
    const publishFnFake = fake();

    const req = {
      body: {
        event: {
          headers: {
            b: 2,
            root,
            topic
          },
          a: 1
        }
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    await post({
      saveEventFn: saveEventFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventFnFake).to.have.been.calledWith({
      id: `${root}_${lastEventNumber + 1}`,
      saved: deps.dateString(),
      a: 1,
      headers: {
        b: 2,
        root,
        number: lastEventNumber + 1,
        topic,
        idempotency: uuid
      }
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvent);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call with last event number as 0 if there is no aggregate", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await post({
      saveEventFn: saveEventFnFake,
      aggregateFn: aggregateFnFake,
      publishFn: publishFnFake
    })(req, res);
    expect(saveEventFnFake).to.have.been.calledWith({
      id: `${root}_${0}`,
      saved: deps.dateString(),
      a: 1,
      headers: {
        b: 2,
        root,
        number: 0,
        topic,
        idempotency
      }
    });
    expect(aggregateFnFake).to.have.been.calledWith(root);
    expect(publishFnFake).to.have.been.calledWith(writtenEvent);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if event number is incorrect", async () => {
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake();
    const publishFnFake = fake();

    const req = {
      body: {
        event,
        number: lastEventNumber
      }
    };

    try {
      await post({
        saveEventFn: saveEventFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const writtenEvent = "some-written-event";
    const saveEventFnFake = fake.returns(writtenEvent);
    const aggregateFnFake = fake.rejects(error);
    const publishFnFake = fake();

    const req = {
      body: {
        event
      }
    };

    try {
      await post({
        saveEventFn: saveEventFnFake,
        aggregateFn: aggregateFnFake,
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw with bad topic domain", async () => {
    const publishFnFake = fake();

    const req = {
      body: {
        event: {
          headers: {
            topic: `did-something.some-bad-domain.${service}`
          }
        }
      }
    };

    try {
      await post({
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should throw with bad topic service", async () => {
    const publishFnFake = fake();

    const req = {
      body: {
        event: {
          headers: {
            topic: `did-something.${domain}.some-bad-service`
          }
        }
      }
    };

    try {
      await post({
        publishFn: publishFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
