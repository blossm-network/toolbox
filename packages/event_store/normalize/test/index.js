const { expect } = require("chai");

const normalize = require("..");

describe("Event store normalize", () => {
  it("should call with the correct string", async () => {
    const result = normalize;
    expect(result).to.equal(
      "function() { const key = this.headers.root; const value = { ...this.payload, _metadata: { count: 0 } }; emit(key, value); }"
    );
  });
});
