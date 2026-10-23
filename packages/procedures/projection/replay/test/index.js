import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fake, match } from "sinon";

import replay from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

describe("Command handler post", () => {
  it("keeps child play IDs stable across replay retries and distinct across new replays", async () => {
    const playIds = [];
    const handler = replay({
      requireReplayId: true,
      replayStores: [{ service: "service", domain: "domain" }],
      rootStreamFn: async ({ fn }) => fn({ root: "root" }),
      playFn: async ({ playId }) => playIds.push(playId),
    });
    const res = { sendStatus: () => {} };
    await handler({ body: { replayId: "one-replay" } }, res);
    await handler({ body: { replayId: "one-replay" } }, res);
    await handler({ body: { replayId: "new-replay" } }, res);
    expect(playIds[0]).to.equal(playIds[1]);
    expect(playIds[0]).not.to.equal(playIds[2]);
    let error;
    try { await handler({}, res); } catch (caught) { error = caught; }
    expect(error && error.statusCode).to.equal(400);
  });

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
