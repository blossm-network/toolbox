const { expect } = require("chai").use(require("sinon-chai"));
const whitelist = require("../src/whitelist");

describe("Whitelist", () => {
  it("should call correctly", async () => {
    const good = "good";
    const list = [good];
    whitelist(list).check(good, (err, flag) => {
      expect(err).to.be.null;
      expect(flag).to.be.true;
    });
  });
  it("should call correctly if origin is undefined", async () => {
    const good = "good";
    const list = [good];
    whitelist(list).check(undefined, (err, flag) => {
      expect(err).to.be.null;
      expect(flag).to.be.true;
    });
  });
  it("should call correctly if incorrect", async () => {
    const good = "good";
    const list = [good];
    whitelist(list).check("bogus", err => {
      expect(err).to.exist;
    });
  });
});
