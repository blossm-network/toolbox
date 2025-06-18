import * as chai from "chai";
import trim from "../index.js";

const { expect } = chai;

describe("Trim string", () => {
  it("should trim correctly", () => {
    const string = "some";

    const result = trim(string, 3);
    expect(result).to.equal("som");
  });
  it("should do nothing if not past length", () => {
    const string = "some";

    const result = trim(string, 4);
    expect(result).to.equal(string);
  });
  it("should add ellipsis correctly", () => {
    const string = "someo";

    const result = trim(string, 4, { ellipsis: "..." });
    expect(result).to.equal("s...");
  });
});
