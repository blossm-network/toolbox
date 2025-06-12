const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const allow = require("../src/allow");

describe("Allow", () => {
  it("should call correctly", async () => {
    const good = "good";
    const list = [good];
    allow(list).check(good, (err, flag) => {
      expect(err).to.be.null;
      expect(flag).to.be.true;
    });
  });
  it("should call correctly if origin is undefined", async () => {
    const good = "good";
    const list = [good];
    allow(list).check(undefined, (err, flag) => {
      expect(err).to.be.null;
      expect(flag).to.be.true;
    });
  });
  it("should call correctly if incorrect", async () => {
    const good = "good";
    const list = [good];
    allow(list).check("bogus", (err) => {
      expect(err).to.exist;
    });
  });
});
