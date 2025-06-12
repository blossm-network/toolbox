const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

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
