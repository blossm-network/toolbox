const fs = require("fs");
const path = require("path");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;

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
