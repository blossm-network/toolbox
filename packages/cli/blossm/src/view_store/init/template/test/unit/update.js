import fs from "fs";
import * as chai from "chai";

const { expect } = chai;
const filename = new URL("../../update.js", import.meta.url);
const hook = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("View store update tests", () => {
  if (!fs.existsSync(filename)) return;
  it("converts the example correctly", () => {
    const update = { $set: { some: "body" } };
    expect(hook(update)).to.deep.equal(update);
  });
});
