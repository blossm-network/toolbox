const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

const formatCsv =
  fs.existsSync(path.resolve(__dirname, "../../format_csv.js")) &&
  require("../../format_csv");

describe("View store format csv tests", () => {
  if (!formatCsv) return;
  it("should convert correctly", async () => {
    const result = formatCsv.fn({ name: "some-name" });
    expect(result).to.deep.equal({ name: "some-name" });
    expect(formatCsv.fields).to.equal(["name"]);
  });
});
