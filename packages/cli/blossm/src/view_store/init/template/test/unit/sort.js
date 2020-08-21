const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const sort =
  fs.existsSync(path.resolve(__dirname, "../../sort.js")) &&
  require("../../sort");

describe("View store sort tests", () => {
  if (!sort) return;
  it("should convert correctly", async () => {
    const sort = { some: "sort" };
    const result = sort(sort);
    expect(result).to.deep.equal(sort);
  });
});
