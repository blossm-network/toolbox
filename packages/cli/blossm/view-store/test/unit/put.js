const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const put =
  fs.existsSync(path.resolve(__dirname, "../../put.js")) &&
  require("../../put");

describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { some: "body" };
    const result = put(body);
    expect(result.update).to.equal(0);
  });
});
