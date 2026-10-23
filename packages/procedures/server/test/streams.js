import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { write, forwardHeaders } from "../index.js";

describe("HTTP response streaming", () => {
  it("waits for drain before the producer continues", async () => {
    const res = new EventEmitter();
    let chunk;
    res.write = (value) => {
      chunk = value;
      return false;
    };
    let finished = false;
    const pending = write(res, { n: 1 }).then(() => {
      finished = true;
    });
    await Promise.resolve();
    assert.equal(finished, false);
    assert.equal(chunk, '{"n":1}');
    res.emit("drain");
    await pending;
    assert.equal(res.listenerCount("close"), 0);
    assert.equal(res.listenerCount("error"), 0);
  });

  it("rejects on disconnect or failure and removes pending listeners", async () => {
    for (const event of ["close", "error"]) {
      const res = new EventEmitter();
      res.write = () => false;
      const pending = write(res, Buffer.from("raw"));
      const failure = new Error("failed write");
      res.emit(event, failure);
      await assert.rejects(
        pending,
        event === "error" ? (error) => error === failure : /closed/
      );
      assert.equal(res.listenerCount("drain"), 0);
    }
    await assert.rejects(write({ destroyed: true }, "closed"), /closed/);
  });

  it("forwards end-to-end response headers without upstream connection framing", () => {
    assert.deepEqual(
      forwardHeaders({
        Connection: "x-hop, keep-alive",
        "x-hop": "private",
        "Keep-Alive": "timeout=5",
        "Content-Length": "42",
        "Transfer-Encoding": "chunked",
        "content-type": "text/plain",
        "set-cookie": ["a=1", "b=2"],
        "x-download": "yes",
      }),
      {
        "content-type": "text/plain",
        "set-cookie": ["a=1", "b=2"],
        "x-download": "yes",
      }
    );
  });
});
