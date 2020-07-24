const { expect } = require("chai");

const hash = require("..");

describe("Keccak Hash string", () => {
  it("it should create a unique hash", async () => {
    const someString = "some-string";
    const someOtherString = "some-other-string";
    const n1 = hash(someString).create();
    const n2 = hash(someOtherString).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
  });
  it("it should create a unique hash with buffers", async () => {
    const someBuffer = Buffer.from("some-string");
    const someOtherBuffer = Buffer.from("some-other-string");
    const someSameBuffer = Buffer.from("some-other-string");
    const n1 = hash(someBuffer).create();
    const n2 = hash(someOtherBuffer).create();
    const n3 = hash(someSameBuffer).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
    expect(n2).to.equal(n3);
  });
  it("it should create a unique hash with objects", async () => {
    const someObject = { a: 1, b: { c: 5 } };
    const someOtherObject = { p: 1, c: { d: 5 } };
    const someSameObject = { p: 1, c: { d: 5 } };
    const n1 = hash(someObject).create();
    const n2 = hash(someOtherObject).create();
    const n3 = hash(someSameObject).create();

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
    const n1 = hash(someString).create();
    const n2 = hash(someOtherString).update(someSameString).create();
    const n3 = hash(someRandomString).create();

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.equal(n2);
    expect(n2).to.not.equal(n3);
  });
});
