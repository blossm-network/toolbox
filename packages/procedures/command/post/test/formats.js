import { strict as assert } from "node:assert";
import post from "../index.js";

describe("Command event formats", () => {
  for (const canonicalFormat of [undefined, 1])
    it(`uses selected format for returned and logged events: ${canonicalFormat}`, async () => {
      const saved = [];
      const event = { root: "r", action: "set", payload: { enabled: true } };
      const handler = post({
        canonicalFormat,
        mainFn: async ({ logEventsFn }) => {
          await logEventsFn([event]);
          return { events: [event] };
        },
        aggregateFn: () => {},
        queryAggregatesFn: () => {},
        readFactFn: () => {},
        streamFactFn: () => {},
        commandFn: () => {},
        countFn: () => {},
        addFn: async ({ eventData }) => saved.push(...eventData),
      });
      const res = { set: () => res, status: () => res, send: () => {} };
      await handler({ body: { headers: {}, payload: {} } }, res);
      assert.equal(saved.length, 2);
      for (const { event } of saved)
        assert.equal(
          event.headers.canonicalFormat,
          canonicalFormat == 1 ? undefined : 2
        );
    });
});
