import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const { expect } = chai;

const formatCsv =
  fs.existsSync(path.resolve(__dirname, "../../format_csv.js")) &&
  import("../../format_csv");

describe("View store format csv tests", () => {
  if (!formatCsv) return;
  it("should convert correctly", async () => {
    const result = formatCsv.fn({ name: "some-name" });
    expect(result).to.deep.equal({ name: "some-name" });
    expect(formatCsv.fields).to.equal(["name"]);
  });
});
