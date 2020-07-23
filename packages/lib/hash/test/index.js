const { expect } = require("chai");

const hash = require("..");

describe("Keccak Hash string", () => {
  it("it should create a unique hash", async () => {
    const someString = "some-string";
    const someOtherString = "some-other-string";
    const n1 = hash.update(someString).create();
    const n2 = hash.update(someOtherString).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
  });
  it("it should create a unique hash with buffers", async () => {
    const someBuffer = Buffer.from("some-string");
    const someOtherBuffer = Buffer.from("some-other-string");
    const someSameBuffer = Buffer.from("some-other-string");
    const n1 = hash.update(someBuffer).create();
    const n2 = hash.update(someOtherBuffer).create();
    const n3 = hash.update(someSameBuffer).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
    expect(n2).to.equal(n3);
  });
  it("it should create a unique hash if same length", async () => {
    const someString = "ab";
    const someOtherString = "a";
    const someSameString = "b";
    const someRandomString = "bc";
    const n1 = hash.update(someString).create();
    const n2 = hash.update(someOtherString).update(someSameString).create();
    const n3 = hash.update(someRandomString).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.equal(n2);
    expect(n2).to.not.equal(n3);
  });
});
