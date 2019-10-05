const { expect } = require("chai");

const hashString = require("..");

describe("Hash", () => {
  it("it should create a unique hash", async () => {
    const someString = "some-string";
    const someOtherString = "some-other-string";
    const n1 = hashString(someString);
    const n2 = hashString(someOtherString);

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n1).to.not.equal(n2);
  });
  it("it should create a unique hash if same length", async () => {
    const someString = "b";
    const someOtherString = "a";
    const someSameString = "a";
    const n1 = hashString(someString);
    const n2 = hashString(someOtherString);
    const n3 = hashString(someSameString);

    expect(n1).to.exist;
    expect(n2).to.exist;
    expect(n3).to.exist;
    expect(n1).to.not.equal(n2);
    expect(n2).to.equal(n3);
  });
});
