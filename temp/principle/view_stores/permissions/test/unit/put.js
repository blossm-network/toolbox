const fs = require("fs");
const path = require("path");

const { expect } = require("chai").use(require("sinon-chai"));

const put =
  fs.existsSync(path.resolve(__dirname, "../../put.js")) &&
  require("../../put");

const add = "some-scope-to-add";
const remove = "some-scope-to-remove";

describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { add, remove };
    const { data } = put(body);
    expect(data).to.deep.equal({
      $push: {
        permissions: add
      },
      $pull: {
        permissions: remove
      }
    });
  });
  it("should convert correctly with nothing specified", async () => {
    const body = {};
    const { data } = put(body);
    expect(data).to.deep.equal({});
  });
});
