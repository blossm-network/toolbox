const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

const format =
  fs.existsSync(path.resolve(__dirname, "../../format_csv.js")) &&
  require("../../format");

describe("View store format tests", () => {
  if (!format) return;
  it("should convert correctly", async () => {
    const body = "some-body";
    const result = format({ body });
    expect(result.body).to.deep.equal(body);
  });
});
