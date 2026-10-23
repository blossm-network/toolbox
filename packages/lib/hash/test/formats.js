import { strict as assert } from "node:assert";
import hash from "../index.js";

describe("Canonical hash formats", () => {
  it("keeps historical vectors and gives distinct Boolean commitments in format 2", () => {
    const vectors = [
      [
        true,
        "e9d530b64ba30c90ccfbdb277b48dc03a74e0dd5f76e27e21f775965652d47b2",
      ],
      [
        false,
        "c5d6675dd3e3782f9edc5d568b0db07d6f64a9f23075e2f2c9406084f619d7f0",
      ],
      [{}, "c33c12bd17c8e87e2fe9bb4d25770bcf16767a18667c51a9bf1fa33724d378f9"],
    ];
    for (const [enabled, expected] of vectors) {
      assert.equal(
        hash({ enabled }).create(),
        "c33c12bd17c8e87e2fe9bb4d25770bcf16767a18667c51a9bf1fa33724d378f9"
      );
      assert.equal(
        hash({ enabled }, { canonicalFormat: 2 }).create(),
        expected
      );
    }
    assert.equal(
      hash({ a: 2, b: 1 }).create(),
      "e8bb4ada8723d3deb51b830d93fff71bc3b11001be5e4dd7acfce16390158b49"
    );
  });

  it("carries the selected format through updates", () => {
    const options = { canonicalFormat: 2 };
    assert.equal(
      hash({ enabled: true }, options).update({ enabled: false }).create(),
      hash('{"enabled":true}{"enabled":false}').create()
    );
    assert.notEqual(
      hash(true, options).create(),
      hash(false, options).create()
    );
  });
  it("does not collapse lone surrogates in values or keys during UTF8 hashing", () => {
    const options = { canonicalFormat: 2 };
    const texts = ["\ud800", "\ud801", "\ufffd", "😀"];
    assert.equal(new Set(texts.map(text => hash({ text }, options).create())).size, 4);
    assert.equal(new Set(texts.map(text => hash({ [text]: true }, options).create())).size, 4);
  });

});
