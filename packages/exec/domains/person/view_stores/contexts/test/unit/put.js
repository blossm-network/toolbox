const fs = require("fs");
const { expect } = require("chai").use(require("sinon-chai"));

const put = fs.existsSync("../../put.js") && require("../../put");

const add = "some-context-to-add";
const remove = "some-context-to-remove";
describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { add, remove };
    const result = put(body);
    expect(result).to.equal({
      $push: {
        contexts: add
      },
      $pull: {
        contexts: {
          root: remove
        }
      }
    });
  });
  it("should convert correctly with nothing specified", async () => {
    const body = {};
    const result = put(body);
    expect(result).to.equal({});
  });
});
