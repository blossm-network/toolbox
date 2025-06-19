import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const { expect } = chai;

const put =
  fs.existsSync(path.resolve(__dirname, "../../put.js")) &&
  import("../../put.js");

describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { view: { some: "body" } };
    const result = put(body);
    expect(result.update).to.equal(0);
  });
});
