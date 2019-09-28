const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const view = "some-view";
const body = {
  a: 1,
  id: "some-bogus",
  created: "more-bogus",
  modified: "even-more-bogus"
};
const uuid = "some-uuid";
const store = "some-store";

describe("View store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

    const req = {
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    await post({ store })(req, res);
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      update: {
        $set: {
          a: 1,
          id: uuid,
          modified: deps.fineTimestamp(),
          created: deps.fineTimestamp()
        }
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
    expect(sendFake).to.have.been.calledWith(view);
  });

  it("should call with the correct params with passed in id", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

    const id = "some-root-id";
    const req = {
      body,
      params: {
        id
      }
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    await post({ store })(req, res);
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id },
      update: {
        $set: {
          a: 1,
          id,
          modified: deps.fineTimestamp(),
          created: deps.fineTimestamp()
        }
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
    expect(sendFake).to.have.been.calledWith(view);
  });

  it("should call with the correct params with fn", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

    const req = {
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const fnFake = fake.returns({ $set: { b: 2 } });
    await post({ store, fn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      update: {
        $set: {
          b: 2,
          id: uuid,
          modified: deps.fineTimestamp(),
          created: deps.fineTimestamp()
        }
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
    expect(fnFake).to.have.been.calledWith(body);
    expect(sendFake).to.have.been.calledWith(view);
  });
});
