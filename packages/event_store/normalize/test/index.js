const { expect } = require("chai");

const normalize = require("..");

describe("Event store normalize", () => {
  it("should call with the correct string", async () => {
    const result = normalize;
    expect(result).to.equal(
      "function() { const key = this.headers.root; const value = { headers: { root: this.headers.root, events: 0 }, state: this.payload }; emit(key, value); }"
    );
  });
});
