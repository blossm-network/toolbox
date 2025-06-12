const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

const put =
  fs.existsSync(path.resolve(__dirname, "../../put.js")) &&
  require("../../put");

describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { view: { some: "body" } };
    const result = put(body);
    expect(result.update).to.equal(0);
  });
});
