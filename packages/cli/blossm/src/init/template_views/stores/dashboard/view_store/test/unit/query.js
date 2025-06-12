const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

const get =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  require("../../get");

describe("View store get tests", () => {
  if (!get) return;
  it("should convert correctly", async () => {
    const query = { some: "query" };
    const context = { some: "context" };
    const result = get({ query, context });
    expect(result).to.deep.equal(query);
  });
});
