import * as chai from "chai";
import sinonChai from "sinon-chai";

import allow from "../src/allow.js";

chai.use(sinonChai);

const { expect } = chai;

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
