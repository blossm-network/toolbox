const { expect } = require("chai");
const removeIds = require("..");

const schema = {
  a: 1,
  b: { c: 2 },
  d: { type: String },
  e: { type: [{ type: { type: String } }] },
  f: [{ g: 1 }]
};

describe("Remove ids from nested schema", () => {
  it("should return successfully", () => {
    const newSchema = removeIds({ schema });
    expect(newSchema).to.deep.equal({
      a: 1,
      b: {
        c: 2,
        _id: false
      },
      d: { type: String },
      e: { type: [{ type: { type: String }, _id: false }] },
      f: [{ g: 1, _id: false }]
    });
  });
});
