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
    const headers = "some-headers";
    const result = format({ body, headers });
    expect(result.body).to.deep.equal(body);
    expect(result.headers).to.deep.equal(headers);
  });
});
