const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const formatCsv =
  fs.existsSync(path.resolve(__dirname, "../../format_csv.js")) &&
  require("../../format_csv");

describe("View store format csv tests", () => {
  if (!formatCsv) return;
  it("should convert correctly", async () => {
    const result = formatCsv([{ b: 1, c: 2 }]);
    expect(result).to.deep.equal([{ a: 3, d: "some-value" }], ["a", "d"]);
  });
});
