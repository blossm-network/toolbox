const { expect } = require("chai");

const nonce = require("..");

describe("Create", () => {
  it("it should create a unique nonce", async () => {
    const n1 = nonce();
    const n2 = nonce();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
  });
});
