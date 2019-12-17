const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const serviceToken = require("..");
const deps = require("../deps");

const hash = 12345;
const procedure0 = "some-procedure0";
const procedure1 = "some-procedure1";
const procedure2 = "some-procedure2";
const procedure = [procedure0, procedure1, procedure2];
const service = "some-service";
const trimmed = "some-trimmed";
const token = "some-token";

describe("Service token", () => {
  afterEach(restore);
  it("should return the correct output", async () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);

    const result = await serviceToken({
      tokenFn: tokenFnFake,
      service,
      procedure
    });
    expect(hashFake).to.have.been.calledWith({ procedure, service });
    expect(trimFake).to.have.been.calledWith(
      "some-service-some-procedure2-some-procedure1-some-procedure0",
      25
    );
    //doesn't mutate the origianl procedure.
    expect(procedure).to.deep.equal([
      "some-procedure0",
      "some-procedure1",
      "some-procedure2"
    ]);
    expect(result).to.equal(token);
  });
});
