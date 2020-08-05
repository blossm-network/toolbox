const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const empty =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  require("../../empty");

describe("View store format tests", () => {
  if (!empty) return;
  it("should convert correctly", async () => {
    const query = "some-query";
    const result = empty({ query });
    expect(result.body).to.deep.equal(query);
  });
});
