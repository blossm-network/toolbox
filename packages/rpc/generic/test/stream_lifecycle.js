import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import rpc from "../index.js";
import deps from "../deps.js";

const builder = (fn, raw = false) => {
  replace(deps, "operationToken", fake.resolves(null));
  replace(deps, "operationUrl", fake.returns("https://fixture.invalid/"));
  return rpc({ operationNameComponents: ["fixture"] })
    .stream(fn, {}, { raw })
    .in({});
};

describe("RPC stream decoder lifetime", () => {
  afterEach(restore);

  it("starts fresh when a truncated stream is retried using the same builder", async () => {
    const output = [];
    const operation = builder((value) => output.push(value));
    let calls = 0;
    replace(deps, "stream", async (_, fn) => {
      await fn(
        Buffer.from(++calls === 1 ? '{"partial":' : '{"complete":true}'),
      );
    });
    await assert.rejects(operation.with(), SyntaxError);
    await operation.with();
    assert.deepEqual(output, [{ complete: true }]);
  });

  it("keeps concurrent executions of the same builder independent", async () => {
    const output = [];
    const operation = builder((value) => output.push(value));
    let calls = 0;
    let release;
    const both = new Promise((resolve) => {
      release = resolve;
    });
    replace(deps, "stream", async (_, fn) => {
      const id = ++calls;
      await fn(Buffer.from('{"id":'));
      if (calls === 2) release();
      await both;
      await fn(Buffer.from(`${id}}`));
    });
    await Promise.all([operation.with(), operation.with()]);
    assert.deepEqual(output.map(({ id }) => id).sort(), [1, 2]);
  });

  it("preserves arbitrary bytes in raw mode without creating a JSON decoder", async () => {
    const output = [];
    const operation = builder((value) => output.push(value), true);
    const bytes = Buffer.from([0xff, 0x7b, 0x80]);
    replace(deps, "jsonDecoder", () => {
      throw new Error("Raw mode must not parse");
    });
    replace(deps, "stream", async (_, fn) => {
      await fn(bytes);
    });
    await operation.with();
    assert.deepEqual(output, [bytes]);
  });
});
