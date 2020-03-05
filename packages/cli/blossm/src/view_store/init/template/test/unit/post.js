const fs = require("fs");
const path = require("path");
const { expect } = require("chai").use(require("sinon-chai"));

const post =
  fs.existsSync(path.resolve(__dirname, "../../post.js")) &&
  require("../../post");

describe("View store post tests", () => {
  if (!post) return;
  it("should convert correctly", async () => {
    const body = { view: { some: "body" } };
    const result = post(body);
    expect(result.update).to.equal(0);
  });
});
