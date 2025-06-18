import { expect } from "chai";

import { componentsFromTimestamp } from "../index.js";

describe("Converts correctly", () => {
  it("it should return correct components", async () => {
    const timestamp = 1559329637;
    const components = componentsFromTimestamp(timestamp);
    expect(components.time).to.equal(68837);
    expect(components.day).to.equal(31);
    expect(components.month).to.equal(4);
    expect(components.year).to.equal(2019);
  });
});
