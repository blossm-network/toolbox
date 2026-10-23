import { COMMITTED } from "@blossm/event-outcome-consts";
import assert from "node:assert/strict";
import { load } from "./load.js";

describe("Generated command write outcomes", () => {
  for (const async of [false, true]) {
    for (const returnOutcomes of [undefined, true]) {
      it(`forwards outcomes=${returnOutcomes} with async=${async}`, async () => {
        const target = { domain: "challenge", service: "core" };
        const eventData = [{ event: { headers: { root: "challenge" } } }];
        const tx = { id: "transaction" };
        const context = { session: { root: "session" } };
        const claims = { principal: "principal" };
        const response = { body: { outcomes: [COMMITTED] } };
        const gcpToken = () => {};
        const enqueue = () => {};
        let destination, settings, submitted;
        const adapter = await load("blossm/src/command/deploy/src/index.js", {
          commandProcedure: (options) => options,
          main: () => {},
          validate: null,
          normalize: null,
          fill: null,
          config: {},
          gcpToken,
          gcpQueue: { enqueue },
          eventStore: (options) => {
            destination = options;
            return {
              set: (options) => {
                settings = options;
                return {
                  add: (data) => {
                    submitted = data;
                    return response;
                  },
                };
              },
            };
          },
        });
        assert.equal(
          await adapter.addFn({
            ...target,
            context,
            claims,
            eventData,
            tx,
            async,
            returnOutcomes,
          }),
          response
        );
        assert.deepEqual(destination, target);
        assert.deepEqual(settings, {
          context,
          claims,
          token: { internalFn: gcpToken },
          ...(async && { enqueue: { fn: enqueue } }),
        });
        assert.deepEqual(submitted, {
          eventData,
          tx,
          ...(returnOutcomes && { returnOutcomes }),
        });
      });
    }
  }
});
