const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const del = require("..");
const deps = require("../deps");

const id = "some-id";
const query = { a: 1 };
const deletedCount = 3;

describe("View store delete", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params with id only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = { id };
    const req = {
      params,
      query: {}
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({ id });
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = {};
    const req = {
      params,
      query: {
        query
      }
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query and id", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = {
      id
    };
    const req = {
      params,
      query: {
        query: {
          ...query,
          id
        }
      }
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      ...query,
      id
    });
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should throw if missing root params", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      params: {},
      query: {}
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const error = new Error("Missing query parameter in the url's query.");
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake
    });

    try {
      await del({ removeFn: removeFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
      expect(messageFake).to.have.been.calledWith(
        "Missing query parameter in the url's query."
      );
    }
  });
});
