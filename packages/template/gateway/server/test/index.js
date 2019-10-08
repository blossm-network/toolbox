const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const authenticationMiddleware = require("@sustainers/authentication-middleware");
const authorizationMiddleware = require("@sustainers/authorization-middleware");

const deps = require("../deps");
const gateway = require("..");

describe("Gateway", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake
    });
    const postFake = fake.returns({
      get: getFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    await gateway();

    expect(listenFake).to.have.been.calledOnce;
    expect(serverFake).to.have.been.calledWith({
      premiddleware: [authenticationMiddleware, authorizationMiddleware]
    });
    expect(postFake).to.have.been.calledWith(commandHandlerPostResult);
    expect(commandHandlerPostFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const listenFake = fake.throws(new Error(errorMessage));
    const getFake = fake.returns({
      listen: listenFake
    });
    const postFake = fake.returns({
      get: getFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const commandHandlerPostResult = "some-post-result";
    const commandHandlerPostFake = fake.returns(commandHandlerPostResult);
    replace(deps, "post", commandHandlerPostFake);

    try {
      await gateway();

      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
