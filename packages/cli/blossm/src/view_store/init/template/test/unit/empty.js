import fs from "fs";
import * as chai from "chai";

const { expect } = chai;
const filename = new URL("../../empty.js", import.meta.url);
const hook = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("View store empty tests", () => {
  if (!fs.existsSync(filename)) return;
  it("converts the example correctly", () => {
    const query = { some: "query" };
    expect(hook(query)).to.deep.equal({ body: query });
  });
});
