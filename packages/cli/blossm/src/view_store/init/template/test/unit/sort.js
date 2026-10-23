import fs from "fs";
import * as chai from "chai";

const { expect } = chai;
const filename = new URL("../../sort.js", import.meta.url);
const hook = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("View store sort tests", () => {
  if (!fs.existsSync(filename)) return;
  it("converts the example correctly", () => {
    const sort = { some: 1 };
    expect(hook(sort)).to.deep.equal(sort);
  });
});
