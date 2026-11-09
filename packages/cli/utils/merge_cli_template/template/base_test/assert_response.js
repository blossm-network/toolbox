import * as chai from "chai";
const { expect } = chai;

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
