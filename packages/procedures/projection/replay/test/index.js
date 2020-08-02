const { expect } = require("chai").use(require("sinon-chai"));
const { fake, match } = require("sinon");

const replay = require("..");

describe("Command handler post", () => {
  it("should call with the correct params", async () => {
    const rootStreamFnFake = fake();

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const replayStoreDomain0 = "some-replay-store-domain-0";
    const replayStoreDomain1 = "some-replay-store-domain-1";
    const replayStoreService0 = "some-replay-store-service-0";
    const replayStoreService1 = "some-replay-store-service-1";

    const replayStores = [
      {
        domain: replayStoreDomain0,
        service: replayStoreService0,
      },
      {
        domain: replayStoreDomain1,
        service: replayStoreService1,
      },
    ];

    const playFnResult = "some-play-fn-result";
    const playFnFake = fake.returns(playFnResult);

    await replay({
      replayStores,
      playFn: playFnFake,
      rootStreamFn: rootStreamFnFake,
    })({}, res);

    expect(rootStreamFnFake.getCall(0)).to.have.been.calledWith({
      domain: replayStoreDomain0,
      service: replayStoreService0,
      fn: match((fn) => {
        const root = "some-root";
        const result = fn({ root });
        return (
          playFnFake.getCall(0).calledWith({
            root,
            domain: replayStoreDomain0,
            service: replayStoreService0,
          }) && result == playFnResult
        );
      }),
    });
    expect(rootStreamFnFake.getCall(1)).to.have.been.calledWith({
      domain: replayStoreDomain1,
      service: replayStoreService1,
      fn: match((fn) => {
        const root = "some-other-root";
        const result = fn({ root });
        return (
          playFnFake.getCall(1).calledWith({
            root,
            domain: replayStoreDomain1,
            service: replayStoreService1,
          }) && result == playFnResult
        );
      }),
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
});
