import fs from "fs";
import * as chai from "chai";

const { expect } = chai;
const filename = new URL("../../format.js", import.meta.url);
const hook = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("View store format tests", () => {
  if (!fs.existsSync(filename)) return;
  it("converts the example correctly", () => {
    const body = { some: "body" };
    expect(hook({ body })).to.deep.equal(body);
  });
});
