const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const del = require("..");

const objs = "some-objs";
const id = "some-id";

describe("View store delete", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const removeFake = fake.returns(objs);
    const store = {
      remove: removeFake
    };
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
      query: {
        id
      }
    });
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if missing id params", async () => {
    const removeFake = fake.returns(objs);
    const store = {
      remove: removeFake
    };
    const params = {};
    const req = {
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    expect(async () => await del({ store })(req, res)).to.throw;
  });
});
