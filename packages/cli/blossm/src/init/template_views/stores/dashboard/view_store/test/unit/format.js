const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const format =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  require("../../format");

describe("View store format tests", () => {
  if (!format) return;
  it("should convert correctly", async () => {
    const body = "some-body";
    const result = format({ body });
    expect(result.body).to.deep.equal(body);
  });
});
