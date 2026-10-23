import {
  COMMITTED,
  DUPLICATE,
  QUEUED,
  UNKNOWN,
} from "@blossm/event-outcome-consts";
import { QUEUED as DELIVERY_QUEUED } from "@blossm/rpc-delivery-consts";
import assert from "node:assert/strict";
import { fake } from "sinon";
import post from "../index.js";

const fixture = (result, addFn = fake.resolves()) => {
  const res = {
    set() {
      return this;
    },
    status() {
      return this;
    },
    send: fake(),
    sendStatus: fake(),
  };
  const handler = post({
    mainFn: typeof result === "function" ? result : async () => result,
    aggregateFn: () => fake(),
    commandFn: () => fake(),
    queryAggregatesFn: () => fake(),
    readFactFn: () => fake(),
    streamFactFn: () => fake(),
    countFn: () => fake(),
    addFn,
  });
  return {
    run: () => handler({ body: { payload: {}, headers: {} } }, res),
    res,
  };
};

describe("Event outcomes passed to thenFn", () => {
  it("keeps original order across interleaved stores and delayed responses", async () => {
    const events = [
      { action: "first", payload: {}, domain: "one", correctNumber: 0 },
      { action: "second", payload: {}, domain: "two" },
      { action: "third", payload: {}, domain: "one" },
    ];
    const thenFn = fake();
    const addFn = fake(async ({ domain, returnOutcomes, async }) => {
      assert.equal(returnOutcomes, true);
      if (domain === "one") {
        assert.equal(async, false);
        await new Promise(setImmediate);
        return { body: { outcomes: [COMMITTED, DUPLICATE] } };
      }
      assert.equal(async, true);
      return { delivery: DELIVERY_QUEUED };
    });
    await fixture({ events, thenFn }, addFn).run();
    assert.deepEqual(thenFn.firstCall.args, [
      {
        outcomes: [
          { event: events[0], status: COMMITTED },
          { event: events[1], status: QUEUED },
          { event: events[2], status: DUPLICATE },
        ],
      },
    ]);
  });

  for (const response of [undefined, null, {}, { statusCode: 204 }]) {
    it(`reports unknown for a legacy response ${JSON.stringify(
      response
    )}`, async () => {
      const event = { action: "answer", payload: {}, correctNumber: 0 };
      const thenFn = fake();
      await fixture({ events: [event], thenFn }, fake.resolves(response)).run();
      assert.deepEqual(thenFn.firstCall.args[0], {
        outcomes: [{ event, status: UNKNOWN }],
      });
    });
  }

  it("passes an empty list when no events were returned", async () => {
    const thenFn = fake();
    await fixture({ thenFn }).run();
    assert.deepEqual(thenFn.firstCall.args[0], { outcomes: [] });
  });

  it("lets callbacks skip effects and response additions on duplicates", async () => {
    const effect = fake.resolves({ response: { upgraded: true } });
    const event = { action: "answer", payload: {}, correctNumber: 0 };
    for (const status of [COMMITTED, DUPLICATE, QUEUED, UNKNOWN]) {
      const f = fixture(
        {
          events: [event],
          response: { kept: true },
          thenFn: async ({ outcomes }) => {
            if (outcomes[0].status !== COMMITTED) return;
            return effect();
          },
        },
        fake.resolves({ body: { outcomes: [status] } })
      );
      await f.run();
      assert.equal(f.res.send.firstCall.args[0].kept, true);
      assert.equal(
        f.res.send.firstCall.args[0].upgraded,
        status === COMMITTED ? true : undefined
      );
    }
    assert.equal(effect.callCount, 1);
  });

  it("returns the same outcomes from explicitly logged events", async () => {
    const event = { action: "answer", payload: {}, correctNumber: 0 };
    let logged;
    await fixture(
      async ({ logEventsFn }) => {
        logged = await logEventsFn([event]);
      },
      fake.resolves({ body: { outcomes: [COMMITTED] } })
    ).run();
    assert.deepEqual(logged, [{ event, status: COMMITTED }]);
  });
});
