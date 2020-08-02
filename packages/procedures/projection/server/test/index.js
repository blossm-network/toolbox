const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const projection = require("..");

const replayStores = "some-replay-stores";
const mainFn = "some-main-fn";
const rootStreamFn = "some-aggregate-stream-fn";
const playFn = "some-play-fn";
const aggregateFn = "some-aggregate-fn";
const readFactFn = "some-read-fact-fn";

describe("Event handler", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const listenFake = fake();
    const playPostFake = fake.returns({
      listen: listenFake,
    });
    const replayPostFake = fake.returns({
      post: playPostFake,
    });
    const serverFake = fake.returns({
      post: replayPostFake,
    });
    replace(deps, "server", serverFake);

    const playPostResult = "some-play-post-result";
    const replayPostResult = "some-replay-post-result";
    const playFake = fake.returns(playPostResult);
    const replayFake = fake.returns(replayPostResult);
    replace(deps, "play", playFake);
    replace(deps, "replay", replayFake);

    await projection({
      replayStores,
      mainFn,
      rootStreamFn,
      playFn,
      aggregateFn,
      readFactFn,
    });

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledOnce;
    expect(replayPostFake).to.have.been.calledWith(replayPostResult, {
      path: "/replay",
    });
    expect(playPostFake).to.have.been.calledWith(playPostResult);
    expect(replayFake).to.have.been.calledWith({
      replayStores,
      playFn,
      rootStreamFn,
    });
    expect(playFake).to.have.been.calledWith({
      mainFn,
      aggregateFn,
      readFactFn,
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const listenFake = fake.throws(new Error(errorMessage));
    const otherPost = fake.returns({
      listen: listenFake,
    });
    const postFake = fake.returns({
      post: otherPost,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const playResult = "some-play-result";
    const playFake = fake.returns(playResult);
    replace(deps, "play", playFake);

    try {
      await projection({
        replayStores,
        mainFn,
        rootStreamFn,
        playFn,
        aggregateFn,
        readFactFn,
      });

      //shouldnt call
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
