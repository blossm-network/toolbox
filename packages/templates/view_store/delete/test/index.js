const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const del = require("..");
const deps = require("../deps");

const id = "some-id";
const store = "some-store";
const deletedCount = 3;

describe("View store delete", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const removeFake = fake.returns({ deletedCount });
    const db = {
      remove: removeFake
    };
    replace(deps, "db", db);

    const params = {
      id
    };
    const req = {
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await del({ store })(req, res);
    expect(removeFake).to.have.been.calledWith({
      store,
      query: {
        id
      }
    });
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should throw if missing id params", async () => {
    const removeFake = fake.returns({ deletedCount });
    const db = {
      remove: removeFake
    };
    replace(deps, "db", db);

    const params = {};
    const req = {
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    try {
      await del({ store })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
      expect(e.message).to.equal("Missing id url parameter");
    }
  });
});
