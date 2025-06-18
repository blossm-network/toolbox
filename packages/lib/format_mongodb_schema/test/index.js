import * as chai from "chai";
import formatSchema from "../index.js";

const { expect } = chai;

describe("Format schema", () => {
  it("should format correctly", () => {
    const schema = {
      a: {
        type: { type: String },
        b: String,
      },
      c: {
        v: Number,
        b: Number,
      },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: String }],
      y: String,
      b: { c: Number },
      v: { n: Number },
      d: String,
      p: [String],
      t: { type: String, unique: true },
      u: [{ g: Number }],
      g: { a: { b: Number } },
      h: { a: { b: String, c: String, d: String } },
      i: { a: { b: String, c: ["String"] } },
      j: { a: { b: { c: { d: String } } } },
      k: { type: { a: { b: { c: { d: String } } } }, default: {} },
      l: { m: String, n: [{ o: String, p: String }] },
      m: [{ q: String, type: String }],
      z: [{ x: String, type: { type: String, in: ["string", "amount"] } }],
    };
    const typeKey = "some-type-key";

    const formattedSchema = formatSchema(schema, typeKey);
    expect(formattedSchema).to.deep.equal({
      a: {
        [typeKey]: {
          type: String,
          b: String,
          _id: false,
        },
      },
      c: {
        [typeKey]: {
          v: Number,
          b: Number,
          _id: false,
        },
      },
      e: {
        [typeKey]: [{ type: String, _id: false }],
      },
      f: {
        [typeKey]: [{ g: String, _id: false }],
      },
      y: { [typeKey]: String },
      b: {
        [typeKey]: {
          c: Number,
          _id: false,
        },
      },
      v: { [typeKey]: { n: Number, _id: false } },
      d: { [typeKey]: String },
      p: { [typeKey]: [String] },
      t: { [typeKey]: String, unique: true },
      u: { [typeKey]: [{ g: Number, _id: false }] },
      g: {
        [typeKey]: { a: { b: Number, _id: false }, _id: false },
      },
      h: {
        [typeKey]: {
          a: {
            b: String,
            c: String,
            d: String,
            _id: false,
          },
          _id: false,
        },
      },
      i: {
        [typeKey]: {
          a: { b: String, c: ["String"], _id: false },
          _id: false,
        },
      },
      j: {
        [typeKey]: {
          a: {
            b: { c: { d: String, _id: false }, _id: false },
            _id: false,
          },
          _id: false,
        },
      },
      k: {
        [typeKey]: {
          a: {
            b: { c: { d: String, _id: false }, _id: false },
            _id: false,
          },
          _id: false,
        },
        default: {},
      },
      l: {
        [typeKey]: {
          m: String,
          n: [
            {
              o: String,
              p: String,
              _id: false,
            },
          ],
          _id: false,
        },
      },
      m: { [typeKey]: [{ q: String, type: String, _id: false }] },
      z: {
        [typeKey]: [{ x: String, type: String, _id: false }],
      },
    });
  });
  it("should format correctly with options", () => {
    const schema = {
      a: {
        type: { type: String },
        b: String,
      },
      c: {
        v: Number,
        b: Number,
      },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: String }],
    };
    const typeKey = "some-type-key";
    const options = {
      some: "options",
      someMore: "oPtIoNs",
    };

    const formattedSchema = formatSchema(schema, typeKey, { options });
    expect(formattedSchema).to.deep.equal({
      a: {
        [typeKey]: {
          type: String,
          b: String,
          _id: false,
        },
        some: "options",
        someMore: "oPtIoNs",
      },
      c: {
        [typeKey]: {
          v: Number,
          b: Number,
          _id: false,
        },
        some: "options",
        someMore: "oPtIoNs",
      },
      e: {
        [typeKey]: [{ type: String, _id: false }],
        some: "options",
        someMore: "oPtIoNs",
      },
      f: {
        [typeKey]: [{ g: String, _id: false }],
        some: "options",
        someMore: "oPtIoNs",
      },
    });
  });
});
