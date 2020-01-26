const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const gateway = require("..");
const whitelist = "some-whitelist";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const domain = "some-domain";

process.env.DOMAIN = domain;

describe("Command gateway", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const permissions = "some-permissions";
    const action = "some-action";
    const commands = [{ action, permissions }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake
    });

    expect(gatewayPostFake).to.have.been.calledWith({ action, domain });
    expect(gatewayPostFake).to.have.been.calledOnce;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match(fn => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          whitelist,
          credentials: true,
          methods: ["POST"]
        });
      })
    });
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${action}`,
      preMiddleware: [authenticationResult, authorizationResult]
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "auth" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions
    });
  });
  it("should call with the correct params with a command key", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const permissions = "some-permissions";
    const action = "some-action";
    const key = "some-key";
    const commands = [{ action, permissions, key }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake
    });

    expect(verifyFnFake).to.have.been.calledWith({ key });
  });
  it("should call with the correct params with multiple commands", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const secondPostFake = fake.returns({
      listen: listenFake
    });
    const postFake = fake.returns({
      post: secondPostFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const permissions = "some-permissions";
    const action1 = "some-action1";
    const action2 = "some-action2";
    const commands = [
      { action: action1, protected: false },
      { action: action2, permissions }
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      action: action1,
      domain
    });
    expect(gatewayPostFake).to.have.been.calledWith({
      action: action2,
      domain
    });
    expect(gatewayPostFake).to.have.been.calledTwice;
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${action1}`
    });
    expect(secondPostFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${action2}`,
      preMiddleware: [authenticationResult, authorizationResult]
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "auth" });
    expect(authorizationFake).to.have.been.calledOnce;
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions
    });
    expect(authorizationFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with passed in domain", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const postFake = fake.returns({
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const permissions = "some-permissions";
    const action = "some-action";
    const commands = [{ action, permissions }];

    const otherDomain = "some-other-domain";

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      domain: otherDomain,
      whitelist,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      action,
      domain: otherDomain
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const serverFake = fake.throws(new Error(errorMessage));
    replace(deps, "server", serverFake);
    try {
      await gateway({
        commands: [],
        whitelist,
        permissionsLookupFn,
        terminatedSessionCheckFn
      });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
