const fs = require("fs");
const { expect } = require("chai").use(require("sinon-chai"));

const get = fs.existsSync("../../get.js") && require("../../get");

describe("View store get tests", () => {
  if (!get) return;
  it("should convert correctly", async () => {
    const query = { some: "query" };
    const result = get(query);
    expect(result.query).to.equal(0);
    expect(result.sort).to.equal(1);
  });
});
