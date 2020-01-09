const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const projection = require("..");

const name = "some-name";
const domain = "some-domain";
const root = "some-root";
const context = "some-context";

const event = {
  headers: {
    root,
    context
  }
};

process.env.DOMAIN = domain;
describe("Projection", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const updateFake = fake();
    const setFake = fake.returns({
      update: updateFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const eventHandlerFake = fake();
    replace(deps, "eventHandler", eventHandlerFake);

    const mainFnResult = "some-result";
    const mainFnFake = fake.returns(mainFnResult);

    await projection({ mainFn: mainFnFake, name });

    expect(eventHandlerFake).to.have.been.calledWith({
      mainFn: match(fn => expect(fn(event)).to.exist)
    });

    await eventHandlerFake.lastCall.lastArg.mainFn(event);
    expect(viewStoreFake).to.have.been.calledWith({ name, domain });
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(updateFake).to.have.been.calledWith(root, mainFnResult);
    expect(mainFnFake).to.have.been.calledWith(event);
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const eventHandlerFake = fake.throws(new Error(errorMessage));
    replace(deps, "eventHandler", eventHandlerFake);

    const mainFnResult = "some-result";
    const mainFnFake = fake.returns(mainFnResult);
    try {
      await projection({ mainFn: mainFnFake, name });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
