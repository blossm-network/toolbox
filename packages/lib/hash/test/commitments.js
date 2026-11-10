import { expect } from "chai";
import hash from "../index.js";

describe("Canonical commitments", () => {
  for (const [enabled, expected] of [
    [true, "e9d530b64ba30c90ccfbdb277b48dc03a74e0dd5f76e27e21f775965652d47b2"],
    [false, "c5d6675dd3e3782f9edc5d568b0db07d6f64a9f23075e2f2c9406084f619d7f0"],
    [{}, "c33c12bd17c8e87e2fe9bb4d25770bcf16767a18667c51a9bf1fa33724d378f9"],
  ])
    it(`pins enabled=${JSON.stringify(enabled)}`, () => {
      expect(hash({ enabled }).create()).to.equal(expected);
    });
  for (const [value, expected] of [
    [true, "6273151f959616268004b58dbb21e5c851b7b8d04498b4aabee12291d22fc034"],
    [false, "ba9154e0baa69c78e0ca563b867df81bae9d177c4ea1452c35c84386a70f0f7a"],
    [0, "044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d"],
    [null, "efbde2c3aee204a69b7696d4b10ff31137fe78e3946306284f806e2dfc68b805"],
    [
      "true",
      "0e8a64c35cbc61a664c115d8e76ddd119b7253283802638cde8d50897ec1fa26",
    ],
  ])
    it(`pins scalar ${JSON.stringify(value)}`, () =>
      expect(hash(value).create()).to.equal(expected));
  it("separates JSON scalars from their string spellings", () => {
    const values = [true, false, 0, null, "true", "false", "0", "null", {}];
    expect(new Set(values.map((value) => hash(value).create())).size).to.equal(
      values.length
    );
  });
  it("appends canonical encodings through updates", () => {
    expect(
      hash({ enabled: true }).update({ enabled: false }).create()
    ).to.not.equal(hash('{"enabled":true}{"enabled":false}').create());
    expect(hash("a").update("b").create()).to.equal(
      "d19b89bd9eeccf7121005fae4e3391733704440e8d216d4eb88be1899deeaa20"
    );
  });
  it("keeps Unicode code units distinct in values and own keys", () => {
    const texts = ["\ud800", "\ud801", "\ufffd", "😀"];
    expect(new Set(texts.map((text) => hash({ text }).create())).size).to.equal(
      4
    );
    expect(
      new Set(texts.map((text) => hash({ [text]: true }).create())).size
    ).to.equal(4);
  });
});
