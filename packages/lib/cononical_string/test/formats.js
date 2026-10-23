import { strict as assert } from "node:assert";
import canonical from "../index.js";

describe("Canonical formats", () => {
  it("preserves the historical unmarked Boolean collision", () => {
    for (const enabled of [true, false, {}]) {
      assert.equal(canonical({ enabled }), '{"enabled":{}}');
      assert.equal(
        canonical({ enabled }, { canonicalFormat: 1 }),
        '{"enabled":{}}'
      );
    }
  });

  it("format 2 preserves every JSON type, nested Booleans and own keys", () => {
    const values = [null, true, false, 0, 1, "", "true", [], {}, [true, false]];
    const encoded = values.map((value) =>
      canonical(value, { canonicalFormat: 2 })
    );
    assert.equal(new Set(encoded).size, values.length);
    values.forEach((value, i) =>
      assert.deepEqual(JSON.parse(encoded[i]), value)
    );
    assert.equal(
      canonical(
        { b: 2, a: [true, false, null, 0, "", {}] },
        { canonicalFormat: 2 }
      ),
      '{"a":[true,false,null,0,"",{}],"b":2}'
    );
    assert.equal(
      canonical(JSON.parse('{"__proto__":true,"a":false}'), {
        canonicalFormat: 2,
      }),
      '{"__proto__":true,"a":false}'
    );
    assert.equal(
      canonical({ a: undefined, b: [undefined] }, { canonicalFormat: 2 }),
      '{"b":[null]}'
    );
    assert.equal(
      canonical({ b: true, a: false }, { canonicalFormat: 2 }),
      canonical({ a: false, b: true }, { canonicalFormat: 2 })
    );
  });

  it("preserves surrogate code units, paired emoji and numeric keys", () => {
    const values = ["\ud800", "\ud801", "\ufffd", "😀"];
    for (const text of values) {
      assert.equal(canonical({ text }, { canonicalFormat: 2 }), `{"text":${JSON.stringify(text)}}`);
      assert.equal(canonical({ [text]: true }, { canonicalFormat: 2 }), `{${JSON.stringify(text)}:true}`);
    }
    assert.equal(canonical({ 2: true, 10: false }, { canonicalFormat: 2 }), '{"10":false,"2":true}');
  });

  it("refuses unknown formats and unsupported JSON data", () => {
    assert.throws(
      () => canonical({}, { canonicalFormat: 3 }),
      /Unsupported canonical format/
    );
    assert.throws(() => canonical({ n: 1n }, { canonicalFormat: 2 }), /BigInt/);
    const cyclic = {};
    cyclic.self = cyclic;
    assert.throws(() => canonical(cyclic, { canonicalFormat: 2 }), /circular/);
  });
});
