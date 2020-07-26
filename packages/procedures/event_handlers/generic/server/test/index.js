const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const eventHandler = require("..");

const mainFn = "some-main-fn";
const aggregateStreamFn = "some-aggregate-stream-fn";

describe("Event handler", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const commandPostResult = "some-post-result";
    const commandPostFake = fake.returns(commandPostResult);
    replace(deps, "post", commandPostFake);

    await eventHandler({
      mainFn,
      aggregateStreamFn,
    });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(postFake).to.have.been.calledWith(commandPostResult);
    expect(commandPostFake).to.have.been.calledWith({
      mainFn,
      aggregateStreamFn,
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const listenFake = fake.throws(new Error(errorMessage));
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const commandPostResult = "some-post-result";
    const commandPostFake = fake.returns(commandPostResult);
    replace(deps, "post", commandPostFake);

    try {
      await eventHandler({ mainFn, aggregateStreamFn });

      //shouldnt call
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
