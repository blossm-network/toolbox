const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const serviceHash = require("..");
const deps = require("../deps");

const hash = 12345;
const procedure0 = "some-procedure0";
const procedure1 = "some-procedure1";
const procedure2 = "some-procedure2";
const procedure = [procedure0, procedure1, procedure2];
const service = "some-service";

describe("Service hash", () => {
  afterEach(restore);
  it("should return the correct output", () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = serviceHash({ procedure, service });
    expect(hashFake).to.have.been.calledWith(
      `${procedure0}${procedure1}${procedure2}${service}`
    );
    expect(result).to.equal("12345");
  });
  // it("should return the correct output", () => {
  //   const result = serviceHash({ procedure: ["challenge", "event-store"], service: "core" });
  //     console.log("result: ", result);
  // });
});
