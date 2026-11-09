import { expect } from "chai";
import canonical from "../index.js";

describe("Canonical JSON bytes", () => {
  const vectors = [
    [null, "null"], [true, "true"], [false, "false"], [0, "0"],
    ["true", '"true"'], ["", '""'], [[], "[]"], [{}, "{}"],
    [{ b: 2, a: [true, false, null, 0, "", {}] }, '{"a":[true,false,null,0,"",{}],"b":2}'],
    [JSON.parse('{"__proto__":true,"a":false}'), '{"__proto__":true,"a":false}'],
    [{ a: undefined, b: [undefined] }, '{"b":[null]}'],
    [{ 2: true, 10: false }, '{"10":false,"2":true}'],
    [{ text: "\ud800" }, '{"text":"\\ud800"}'],
    [{ text: "\ud801" }, '{"text":"\\ud801"}'],
    [{ text: "\ufffd" }, '{"text":"�"}'],
    [{ text: "😀" }, '{"text":"😀"}'],
  ];
  for (const [value, bytes] of vectors)
    it(`pins ${bytes}`, () => expect(canonical(value)).to.equal(bytes));

  it("preserves JSON types and key insertion independence", () => {
    for (const value of [null, true, false, 0, 1, "", "true", [], {}, [true, false]])
      expect(JSON.parse(canonical(value))).to.deep.equal(value);
    expect(canonical({ b: true, a: false })).to.equal(canonical({ a: false, b: true }));
  });
  it("rejects values outside the JSON contract", () => {
    expect(() => canonical({ n: 1n })).to.throw(/BigInt/);
    const cyclic = {}; cyclic.self = cyclic;
    expect(() => canonical(cyclic)).to.throw(/circular/);
  });
});
