const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const del = require("..");
const deps = require("../deps");

const root = "some-root";
const query = { a: 1 };
const deletedCount = 3;

describe("View store delete", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params with root only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = { root };
    const req = {
      params,
      query: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({ "headers.root": root });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = {};
    const req = {
      params,
      query: {
        query,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({ "body.a": 1 });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query and root", async () => {
    const removeFake = fake.returns({ deletedCount });

    const params = {
      root,
    };
    const req = {
      params,
      query: {
        query,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "body.a": 1,
      "headers.root": root,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should throw if missing root params", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      params: {},
      query: {},
    };

    const res = {};

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
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
