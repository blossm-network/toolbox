import assert from "node:assert/strict";
import request from "../index.js";

const objects = [
  { text: '🦋 braces } [, escaped " and \\', nested: [{ n: 1 }] },
  [{ n: 2 }, { n: 3 }],
  {},
];
const bytes = Buffer.from(
  objects.map((object) => JSON.stringify(object)).join("\n"),
);

describe("JSON stream decoder", () => {
  it("preserves every UTF-8 byte split across consecutive nested records", () => {
    for (let split = 0; split <= bytes.length; split++) {
      const decoder = request.jsonDecoder();
      assert.deepEqual(
        [
          ...decoder.write(bytes.subarray(0, split)),
          ...decoder.write(bytes.subarray(split)),
          ...decoder.end(),
        ],
        objects,
      );
    }
  });

  it("retains state when every chunk is a single byte", () => {
    const decoder = request.jsonDecoder();
    const output = [];
    for (const byte of bytes)
      output.push(...decoder.write(Buffer.from([byte])));
    assert.deepEqual([...output, ...decoder.end()], objects);
  });

  it("has independent source state and accepts an empty stream", () => {
    const first = request.jsonDecoder();
    const second = request.jsonDecoder();
    assert.deepEqual(first.write('{"first":'), []);
    assert.deepEqual(second.write('{"second":2}'), [{ second: 2 }]);
    assert.deepEqual(first.write("1}"), [{ first: 1 }]);
    assert.deepEqual(first.end(), []);
    assert.deepEqual(second.end(), []);
    assert.deepEqual(request.jsonDecoder().end(), []);
  });

  it("rejects malformed records, trailing data and truncated final records", () => {
    assert.throws(() => request.jsonDecoder().write('{"bad":]}'), SyntaxError);
    assert.throws(() => request.jsonDecoder().write("{}garbage"), SyntaxError);
    const decoder = request.jsonDecoder();
    decoder.write('{"unfinished":');
    assert.throws(() => decoder.end(), SyntaxError);
  });
});

describe("JSON stream input integrity", () => {
  it("rejects invalid and unfinished UTF-8 instead of changing string values", () => {
    const invalid = Buffer.concat([
      Buffer.from('{"text":"'),
      Buffer.from([0xff]),
      Buffer.from('"}'),
    ]);
    assert.throws(() => request.jsonDecoder().write(invalid), TypeError);
    const decoder = request.jsonDecoder();
    decoder.write(Buffer.from([0xf0, 0x9f]));
    assert.throws(() => decoder.end(), TypeError);
  });

  it("retains a UTF-16 surrogate pair split across direct string chunks", () => {
    const decoder = request.jsonDecoder();
    assert.deepEqual(decoder.write('{"text":"\ud83e'), []);
    assert.deepEqual(decoder.write('\udd8b"}'), [{ text: "🦋" }]);
    assert.deepEqual(decoder.end(), []);
  });

  it("accepts JSON whitespace and rejects non-JSON separators", () => {
    const decoder = request.jsonDecoder();
    assert.deepEqual(decoder.write(" \t\r\n{} \t\r\n[]"), [{}, []]);
    assert.deepEqual(decoder.end(), []);
    assert.throws(() => request.jsonDecoder().write("{}\u00a0{}"), SyntaxError);
  });
});
