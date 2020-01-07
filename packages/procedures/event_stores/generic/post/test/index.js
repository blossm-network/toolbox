const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const root = "some-root";
const event = {
  headers: {
    b: 2,
    root
  },
  a: 1,
  id: "some-bogus",
  created: "more-bogus"
};
const uuid = "some-uuid";
const lastEventNumber = 4;
const found = { headers: { lastEventNumber } };

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeResult = "some-write-result";
    const writeFnFake = fake.returns(writeResult);
    const mapReduceFnFake = fake();
    const publishFnFake = fake();
    const findOneFnFake = fake.returns(found);

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

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    await post({
      writeFn: writeFnFake,
      mapReduceFn: mapReduceFnFake,
      publishFn: publishFnFake,
      findOneFn: findOneFnFake
    })(req, res);
    expect(writeFnFake).to.have.been.calledWith({
      id: uuid,
      data: {
        a: 1,
        headers: {
          b: 2,
          root,
          number: lastEventNumber + 1,
          numberRoot: `${lastEventNumber + 1}_${root}`
        },
        id: uuid,
        created: deps.dateString()
      }
    });
    expect(mapReduceFnFake).to.have.been.calledWith({
      id: uuid
    });
    expect(publishFnFake).to.have.been.calledWith(writeResult);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if event number is incorrect", async () => {
    const writeResult = "some-write-result";
    const writeFnFake = fake.returns(writeResult);
    const mapReduceFnFake = fake();
    const publishFnFake = fake();
    const findOneFnFake = fake.returns(found);

    const req = {
      body: {
        event,
        number: lastEventNumber
      }
    };

    try {
      await post({
        writeFn: writeFnFake,
        mapReduceFn: mapReduceFnFake,
        publishFn: publishFnFake,
        findOneFn: findOneFnFake
      })(req);
    } catch (e) {
      expect(e.statusCode).to.equal(412);
    }
  });

  it("should throw correctly", async () => {
    const error = new Error();
    const writeFnFake = fake();
    const mapReduceFnFake = fake();
    const publishFnFake = fake();
    const findOneFnFake = fake.rejects(error);

    const req = {
      body: {
        event
      }
    };

    const res = {};

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    try {
      await post({
        writeFn: writeFnFake,
        mapReduceFn: mapReduceFnFake,
        publishFn: publishFnFake,
        findOneFn: findOneFnFake
      })(req, res);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
