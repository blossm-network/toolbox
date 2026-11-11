import { expect } from "chai";
import { EventEmitter } from "node:events";
import stream from "../index.js";

describe("Fact producer backpressure", () => {
  for (const disconnect of [false, true]) {
    it(
      disconnect
        ? "rejects a disconnected producer before its next record"
        : "waits for drain before producing the next record or ending",
      async () => {
        const res = new EventEmitter();
        const chunks = [];
        let ended = false;
        res.write = (chunk) => {
          chunks.push(chunk);
          return chunks.length !== 1;
        };
        res.end = () => {
          ended = true;
        };
        const helper = () => () => {};
        const pending = stream({
          mainFn: async ({ streamFn }) => {
            for (const value of [{ n: 1 }, { n: 2 }]) await streamFn(value);
          },
          queryAggregatesFn: helper,
          aggregateFn: helper,
          readFactFn: helper,
          streamFactFn: helper,
        })({ query: {}, params: {} }, res);
        await Promise.resolve();
        expect(chunks).to.deep.equal(['{"n":1}']);
        expect(ended).to.equal(false);
        if (disconnect) {
          res.destroyed = true;
          res.emit("close");
          let error;
          try {
            await pending;
          } catch (failure) {
            error = failure;
          }
          expect(error?.message).to.match(/closed/);
          expect(chunks).to.have.length(1);
          expect(ended).to.equal(false);
        } else {
          res.emit("drain");
          await pending;
          expect(chunks).to.deep.equal(['{"n":1}', '{"n":2}']);
          expect(ended).to.equal(true);
        }
        expect(res.listenerCount("drain")).to.equal(0);
        expect(res.listenerCount("close")).to.equal(0);
      },
    );
  }
});
