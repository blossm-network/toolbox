const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const gateway = require("..");
const whitelist = "some-whitelist";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const subcontext = "some-subcontext";
const algorithm = "some-algorithm";
const keyClaimsFn = "some-token-claims-fn";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";
const audience = "some-audience";

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

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
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name = "some-name";
    const commands = [{ name, privileges, subcontext }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      internalTokenFn,
      externalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service,
      internalTokenFn,
      externalTokenFn,
      key: "access",
    });
    expect(gatewayPostFake).to.have.been.calledOnce;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          whitelist,
          credentials: true,
          methods: ["POST"],
        });
      }),
    });
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name}`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      audience,
      algorithm,
      strict: true,
      allowBasic: false,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      internalTokenFn,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
      context: subcontext,
    });
  });
  it("should call with the correct params with privileges set to none and network in command", async () => {
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
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const privileges = "none";
    const name = "some-name";
    const network = "some-network";
    const commands = [{ name, network, privileges, subcontext, basic: true }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      internalTokenFn,
      externalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      network,
      service,
      domain,
      internalTokenFn,
      externalTokenFn,
      key: "access",
    });
    expect(gatewayPostFake).to.have.been.calledOnce;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          whitelist,
          credentials: true,
          methods: ["POST"],
        });
      }),
    });
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name}`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      audience,
      algorithm,
      strict: true,
      allowBasic: true,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      internalTokenFn,
      context: subcontext,
      permissions: "none",
    });
  });
  it("should call with the correct params with a command key and command server", async () => {
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
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const name = "some-command-name";
    const key = "some-command-key";
    const otherService = "some-other-server";

    const privilege = "some-privilege";
    const privileges = [privilege];

    const commands = [{ name, privileges, key, service: otherService }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      internalTokenFn,
      externalTokenFn,
      algorithm,
      audience,
    });

    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: key,
      keyClaimsFn,
      audience,
      algorithm,
      strict: true,
      allowBasic: false,
    });

    expect(verifyFnFake).to.have.been.calledWith({ key });
    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service: otherService,
      internalTokenFn,
      externalTokenFn,
      key,
    });
  });
  it("should call with the correct params with multiple commands with difference protections", async () => {
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
      listen: listenFake,
    });
    const postFake = fake.returns({
      post: secondPostFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name1 = "some-name1";
    const name2 = "some-name2";
    const commands = [
      { name: name1, protection: "none" },
      { name: name2, privileges, subcontext },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      whitelist,
      internalTokenFn,
      externalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
    });

    expect(gatewayPostFake.getCall(0)).to.have.been.calledWith({
      name: name1,
      domain,
      service,
      internalTokenFn,
      externalTokenFn,
      key: "access",
    });
    expect(gatewayPostFake.getCall(1)).to.have.been.calledWith({
      name: name2,
      domain,
      service,
      internalTokenFn,
      externalTokenFn,
      key: "access",
    });
    expect(gatewayPostFake).to.have.been.calledTwice;
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name1}`,
      preMiddleware: [authenticationResult],
    });
    expect(secondPostFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name2}`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      algorithm,
      audience,
      strict: true,
      allowBasic: false,
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      algorithm,
      audience,
      strict: false,
      allowBasic: false,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledOnce;
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      internalTokenFn,
      context: subcontext,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
    });
    expect(authorizationFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with passed in domain and service", async () => {
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
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const privilege = "some-privilege";
    const privileges = [privilege];

    const name = "some-name";
    const commands = [{ name, privileges, subcontext }];

    const otherDomain = "some-other-domain";
    const otherService = "some-other-service";

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      domain: otherDomain,
      service: otherService,
      whitelist,
      internalTokenFn,
      externalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain: otherDomain,
      service: otherService,
      internalTokenFn,
      externalTokenFn,
      key: "access",
    });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      internalTokenFn,
      context: subcontext,
      permissions: privileges.map((privilege) => {
        return { service: otherService, domain: otherDomain, privilege };
      }),
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
        terminatedSessionCheckFn,
      });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
