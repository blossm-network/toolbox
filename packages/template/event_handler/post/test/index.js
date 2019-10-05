const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const post = require("..");

const event = { a: 1 };
const data = Buffer.from(JSON.stringify(event));

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();
    const req = {
      body: {
        message: {
          data
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

    await post({
      mainFn: mainFnFake
    })(req, res);

    expect(mainFnFake).to.have.been.calledWith(event);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should call correct error when theres no body", async () => {
    const mainFnFake = fake();
    const req = {};

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await post({
        mainFn: mainFnFake
      })(req, res);

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should call correct error when theres no message", async () => {
    const mainFnFake = fake();
    const req = {
      body: {}
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    try {
      await post({
        mainFn: mainFnFake
      })(req, res);

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should call correct error when the event isnt paresable", async () => {
    const mainFnFake = fake();
    const req = {
      body: {
        message: {
          data: Buffer.from("bad")
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

    try {
      await post({
        mainFn: mainFnFake
      })(req, res);

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
});
