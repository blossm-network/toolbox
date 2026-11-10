import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake, replace } from "sinon";

import play from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const timestamp = 5;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const root = "some-root";
const hash = "some-event-hash";

const readFactFn = "some-read-fact-fn";

const data = Buffer.from(
  JSON.stringify({ timestamp, action, domain, service, root, hash }),
);

describe("Command handler post", () => {
  it("starts the durable session before reading any aggregate and retains stable event identity", async () => {
    const order = [];
    const session = { add: () => {} };
    await play({
      sessionFn: async ({ playId, run }) => {
        expect(playId).to.equal(
          JSON.stringify(["pubsub", "subscription", hash]),
        );
        order.push("lease");
        await run(session);
      },
      aggregateFn: async () => {
        order.push("aggregate");
        return {};
      },
      mainFn: async (args) => {
        expect(args.session).to.equal(session);
        order.push("transform");
      },
    })(
      {
        body: {
          subscription: "subscription",
          message: { data, messageId: "message" },
        },
      },
      { sendStatus: () => {} },
    );
    expect(order).to.deep.equal(["lease", "aggregate", "transform"]);
  });

  it("deduplicates a republished event across transport message IDs within its subscription", async () => {
    const ids = [];
    const handler = play({ sessionFn: async ({ playId }) => ids.push(playId) });
    for (const [subscription, eventHash, messageId] of [
      ["subscription", "hash", "first-message"],
      ["subscription", "hash", "republished-message"],
      ["subscription", "next-hash", "message"],
      ["other-subscription", "hash", "message"],
      ["scope:part", "hash", "message"],
      ["scope", "part:hash", "message"],
    ]) {
      await handler(
        {
          body: {
            subscription,
            message: {
              messageId,
              data: Buffer.from(JSON.stringify({ root, hash: eventHash })),
            },
          },
        },
        { sendStatus: () => {} },
      );
    }
    expect(ids[0]).to.equal(ids[1]);
    expect(new Set([ids[0], ...ids.slice(2)]).size).to.equal(5);
  });

  it("requires stable event identity before starting a Pub/Sub session or reading state", async () => {
    const aggregateFn = fake();
    const sessionFn = fake();
    const handler = play({ aggregateFn, sessionFn });
    for (const [subscription, eventHash] of [
      ["subscription", undefined],
      ["subscription", ""],
      ["subscription", null],
      ["subscription", 123],
      [undefined, "hash"],
      ["", "hash"],
    ]) {
      let error;
      try {
        await handler(
          {
            body: {
              subscription,
              message: {
                messageId: "transport-only",
                data: Buffer.from(JSON.stringify({ root, hash: eventHash })),
              },
            },
          },
          { sendStatus: () => {} },
        );
      } catch (caught) {
        error = caught;
      }
      expect(error && error.statusCode).to.equal(400);
    }
    expect(sessionFn).not.to.have.been.called;
    expect(aggregateFn).not.to.have.been.called;
  });

  it("retains explicit and queued direct play IDs", async () => {
    const ids = [];
    const handler = play({ sessionFn: async ({ playId }) => ids.push(playId) });
    await handler(
      { body: { root, playId: "replay-child" } },
      { sendStatus: () => {} },
    );
    await handler(
      { body: { root }, headers: { "x-cloudtasks-taskname": "queued-play" } },
      { sendStatus: () => {} },
    );
    expect(ids).to.deep.equal(["replay-child", "queued-play"]);
  });

  it("a session covers the complete transform so a competing play rereads newer state", async () => {
    let state = 1,
      view,
      release,
      entered,
      busy = false;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    const handler = play({
      sessionFn: async ({ run }) => {
        if (busy) throw new Error("busy");
        busy = true;
        try {
          await run({});
        } finally {
          busy = false;
        }
      },
      aggregateFn: async () => ({ state }),
      mainFn: async ({ aggregate }) => {
        if (aggregate.state === 1) {
          entered();
          await gate;
        }
        view = aggregate.state;
      },
    });
    const req = { body: { root: "root", playId: "play" } };
    const res = { sendStatus: () => {} };
    const first = handler(req, res);
    await started;
    state = 2;
    let error;
    try {
      await handler(req, res);
    } catch (caught) {
      error = caught;
    }
    expect(error && error.message).to.equal("busy");
    release();
    await first;
    await handler(req, res);
    expect(view).to.equal(2);
  });

  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();

    const aggregate = "some-aggregate";
    const aggregateFnFake = fake.returns(aggregate);

    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await play({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      readFactFn,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });

    expect(mainFnFake).to.have.been.calledWith({
      aggregate,
      aggregateFn: aggregateFnFake,
      readFactFn,
      push: true,
      action,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with muted events", async () => {
    const mainFnFake = fake();

    const aggregate = "some-aggregate";
    const aggregateFnFake = fake.returns(aggregate);

    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    const mutedEvents = [{ actions: [action], domain, service }];

    await play({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      readFactFn,
      mutedEvents,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });

    expect(mainFnFake).to.have.been.calledWith({
      aggregate,
      aggregateFn: aggregateFnFake,
      readFactFn,
      push: false,
      action,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with no message", async () => {
    const mainFnFake = fake();

    const aggregate = "some-aggregate";
    const aggregateFnFake = fake.returns(aggregate);

    const bodyRoot = "some-body-root";
    const bodyDomain = "some-body-domain";
    const bodyService = "some-body-service";

    const req = {
      body: {
        root: bodyRoot,
        domain: bodyDomain,
        service: bodyService,
        action: "bogus",
        push: "bogus",
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await play({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      readFactFn,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({
      root: bodyRoot,
      domain: bodyDomain,
      service: bodyService,
    });

    expect(mainFnFake).to.have.been.calledWith({
      aggregate,
      aggregateFn: aggregateFnFake,
      readFactFn,
      push: false,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should throw if bad data format", async () => {
    const mainFnFake = fake();

    const data = Buffer.from("bad");
    const req = {
      body: {
        message: { data },
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await play({ mainFn: mainFnFake })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Invalid data format.");
      expect(e).to.equal(error);
    }
  });
  it("should throw if no root", async () => {
    const mainFnFake = fake();

    const req = {
      body: {},
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await play({ mainFn: mainFnFake })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("A root wasn't specified.");
      expect(e).to.equal(error);
    }
  });
});
