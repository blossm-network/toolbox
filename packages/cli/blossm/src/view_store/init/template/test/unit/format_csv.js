import fs from "fs";
import * as chai from "chai";

const { expect } = chai;
const filename = new URL("../../format_csv.js", import.meta.url);
const hook = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("View store format_csv tests", () => {
  if (!fs.existsSync(filename)) return;
  it("converts the example correctly", () => {
    expect(hook.fn({ name: "some-name" })).to.deep.equal({ name: "some-name" });
    expect(hook.fields).to.deep.equal(["name"]);
  });
});
