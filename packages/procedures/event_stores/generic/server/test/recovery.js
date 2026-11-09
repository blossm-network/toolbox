import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import server from "../index.js";
import post from "../../post/index.js";
import createBlock from "../../create_block/index.js";
import { COMMITTED } from "@blossm/event-outcome-consts";
import deps from "../deps.js";

describe("Required durable publication", () => {
  let nodeEnv;
  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const builder = {
      get() {
        return this;
      },
      post() {
        return this;
      },
      listen: fake(),
    };
    replace(deps, "server", fake.returns(builder));
    replace(deps, "logger", { error: fake() });
    replace(deps, "post", fake());
    replace(deps, "createBlock", fake());
  });
  afterEach(() => {
    restore();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  });

  it("supplies the required dispatcher to event and scheduled block routes", async () => {
    const publishPendingFn = fake.resolves();
    await server({ publishPendingFn });
    const recover = deps.post.firstCall.args[0].publishPendingFn;
    expect(recover).not.to.equal(publishPendingFn);
    expect(deps.createBlock.firstCall.args[0].publishPendingFn).to.equal(
      recover
    );
  });

  it("rejects a missing dispatcher before constructing routes or listening", async () => {
    await rejects(server(), /require durable publication/);
    expect(deps.server.callCount).to.equal(0);
    expect(deps.post.callCount).to.equal(0);
    expect(deps.createBlock.callCount).to.equal(0);
  });

  it("allows the explicit local mode without publication", async () => {
    process.env.NODE_ENV = "local";
    await server();
    expect(deps.server.returnValues[0].listen.callCount).to.equal(1);
    expect(deps.logger.error.callCount).to.equal(0);
  });

  it("attempts recovery once and waits for it before listening", async () => {
    let finish;
    const publishPendingFn = fake(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const starting = server({ publishPendingFn });
    expect(publishPendingFn.callCount).to.equal(1);
    expect(deps.server.callCount).to.equal(0);
    finish();
    await starting;
    expect(deps.server.returnValues[0].listen.callCount).to.equal(1);
    expect(publishPendingFn.callCount).to.equal(1);
  });

  it("logs a failed recovery attempt and still starts listening", async () => {
    const error = Object.assign(new Error("publisher unavailable"), {
      code: "UNAVAILABLE",
    });
    const publishPendingFn = fake.rejects(error);
    await server({ publishPendingFn });
    expect(publishPendingFn.callCount).to.equal(1);
    expect(deps.server.returnValues[0].listen.callCount).to.equal(1);
    expect(deps.logger.error.firstCall.args).to.deep.equal([
      "Publication recovery failed; pending work remains for retry.",
      { name: "Error", code: "UNAVAILABLE" },
    ]);
  });

  for (const returnOutcomes of [false, true]) {
    it(`reports the committed POST result despite publication failure (outcomes: ${returnOutcomes})`, async () => {
      deps.post = fake(post);
      const publishPendingFn = fake.rejects(new Error("publisher unavailable"));
      const createTransactionFn = fake.resolves();
      await server({
        publishPendingFn,
        createTransactionFn,
        idempotencyConflictCheckFn: fake.resolves(false),
      });
      const response = { send: fake(), sendStatus: fake() };
      await deps.post.firstCall.returnValue(
        {
          body: {
            eventData: [{ event: { headers: { idempotency: "fresh" } } }],
            returnOutcomes,
          },
        },
        response
      );
      expect(createTransactionFn.callCount).to.equal(1);
      expect(publishPendingFn.callCount).to.equal(2);
      expect(deps.logger.error.callCount).to.equal(2);
      if (returnOutcomes)
        expect(response.send.firstCall.args[0]).to.deep.equal({
          outcomes: [COMMITTED],
        });
      else expect(response.sendStatus.firstCall.args[0]).to.equal(204);
    });
  }

  it("returns the committed block despite publication failure", async () => {
    deps.createBlock = fake(createBlock);
    const block = { hash: "committed-block" };
    const publishPendingFn = fake.rejects(new Error("publisher unavailable"));
    await server({
      publishPendingFn,
      createTransactionFn: fake.resolves({ block, full: false }),
    });
    const send = fake();
    await deps.createBlock.firstCall.returnValue({}, { send });
    expect(send.firstCall.args[0]).to.equal(block);
    expect(publishPendingFn.callCount).to.equal(2);
    expect(deps.logger.error.callCount).to.equal(2);
  });
});
