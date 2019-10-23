const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");
const authentication = require("@sustainers/authentication-middleware");

const deps = require("../deps");
const gateway = require("..");
const whitelist = "some-whitelist";
const scopesLookupFn = "some-lookup-fn";

describe("View gateway", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      get: getFake
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    await gateway({ whitelist, scopesLookupFn });

    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match(fn => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          whitelist,
          credentials: true,
          methods: ["GET"]
        });
      })
    });
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: "/:domain/:name",
      preMiddleware: [authentication, authorizationResult]
    });
    expect(authorizationFake).to.have.been.calledWith({ scopesLookupFn });
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const serverFake = fake.throws(new Error(errorMessage));
    replace(deps, "server", serverFake);
    try {
      await gateway({ whitelist, scopesLookupFn });
      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
