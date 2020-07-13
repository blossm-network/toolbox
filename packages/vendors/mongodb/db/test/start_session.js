const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { startSession } = require("../index");

const deps = require("../deps");

describe("Start session", () => {
  afterEach(() => {
    restore();
  });

  it("it should return a session", () => {
    const session = "some-session";
    const startSessionFake = fake.returns(session);
    replace(deps.mongoose, "startSession", startSessionFake);

    const result = startSession();

    expect(result).to.equal(session);
    expect(startSessionFake).to.have.been.calledWith();
  });
});
