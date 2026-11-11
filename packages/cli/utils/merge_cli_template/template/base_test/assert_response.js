import * as chai from "chai";
const { expect } = chai;

// Null/undefined expected fields are presence-only; objects and arrays describe
// subsets, so additional response fields and array entries are allowed.
const checkResponse = ({ data, expected }) => {
  if (expected == null) return;
  if (expected instanceof Array) expect(data).to.be.an("array");
  if (typeof expected !== "object") {
    expect(data).to.deep.equal(expected);
    return;
  }
  for (const property in expected) {
    expect(data[property]).to.exist;
    checkResponse({ data: data[property], expected: expected[property] });
  }
};

export default checkResponse;
