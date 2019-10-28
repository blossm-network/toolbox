const fs = require("fs");
const { expect } = require("chai").use(require("sinon-chai"));

const post = fs.existsSync("../../post.js") && require("../../post");

describe("View store post tests", () => {
  if (!post) return;
  it("should convert correctly", async () => {
    const body = { some: "body" };
    const result = post(body);
    expect(result.update).to.equal(0);
  });
});
