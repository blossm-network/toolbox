const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const get =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  require("../../get");

describe("View store get tests", () => {
  if (!get) return;
  it("should convert correctly", async () => {
    const context = { identity: "some-identity" };
    const result = get({ context });
    expect(result).to.deep.equal({ identity: "some-identity" });
  });
});
