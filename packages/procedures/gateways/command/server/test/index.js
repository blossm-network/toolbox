const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const gateway = require("..");
const whitelist = "some-whitelist";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const domain = "some-domain";
const service = "some-service";
const keyClaimsFn = "some-token-claims-fn";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

process.env.DOMAIN = domain;
process.env.SERVICE = service;

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

    const priviledge = "some-priviledge";
    const priviledges = [priviledge];
    const name = "some-name";
    const commands = [{ name, priviledges }];

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
      keyClaimsFn
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service,
      internalTokenFn,
      externalTokenFn
    });
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
      path: `/${name}`,
      preMiddleware: [authenticationResult, authorizationResult]
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      keyClaimsFn,
      strict: true
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions: priviledges.map(priviledge => {
        return { service, domain, priviledge };
      })
    });
  });
  it("should call with the correct params with priviledges set to none and network in command", async () => {
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

    const priviledges = "none";
    const name = "some-name";
    const network = "some-network";
    const commands = [{ name, network, priviledges }];

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
      keyClaimsFn
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      network,
      service,
      domain,
      internalTokenFn,
      externalTokenFn
    });
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
      path: `/${name}`,
      preMiddleware: [authenticationResult, authorizationResult]
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      keyClaimsFn,
      strict: true
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions: "none"
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
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const name = "some-command-name";
    const key = "some-command-key";
    const otherService = "some-other-server";

    const priviledge = "some-priviledge";
    const priviledges = [priviledge];

    const commands = [{ name, priviledges, key, service: otherService }];

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
      externalTokenFn
    });

    expect(verifyFnFake).to.have.been.calledWith({ key });
    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service: otherService,
      internalTokenFn,
      externalTokenFn
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
    const thirdPostFake = fake.returns({
      listen: listenFake
    });
    const secondPostFake = fake.returns({
      post: thirdPostFake
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

    const priviledge = "some-priviledge";
    const priviledges = [priviledge];
    const name1 = "some-name1";
    const name2 = "some-name2";
    const name3 = "some-name3";
    const commands = [
      { name: name1, protection: "none" },
      { name: name2, protection: "context" },
      { name: name3, priviledges }
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
      keyClaimsFn
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name: name1,
      domain,
      service,
      internalTokenFn,
      externalTokenFn
    });
    expect(gatewayPostFake).to.have.been.calledWith({
      name: name2,
      domain,
      service,
      internalTokenFn,
      externalTokenFn
    });
    expect(gatewayPostFake).to.have.been.calledWith({
      name: name3,
      domain,
      service,
      internalTokenFn,
      externalTokenFn
    });
    expect(gatewayPostFake).to.have.been.calledThrice;
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name1}`
    });
    expect(secondPostFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name2}`,
      preMiddleware: [authenticationResult]
    });
    expect(thirdPostFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name3}`,
      preMiddleware: [authenticationResult, authorizationResult]
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      keyClaimsFn,
      strict: true
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      keyClaimsFn,
      strict: false
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledOnce;
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions: priviledges.map(priviledge => {
        return { service, domain, priviledge };
      })
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
      listen: listenFake
    });
    const serverFake = fake.returns({
      post: postFake
    });
    replace(deps, "server", serverFake);

    const gatewayPostResult = "some-post-result";
    const gatewayPostFake = fake.returns(gatewayPostResult);
    replace(deps, "post", gatewayPostFake);

    const priviledge = "some-priviledge";
    const priviledges = [priviledge];

    const name = "some-name";
    const commands = [{ name, priviledges }];

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
      keyClaimsFn
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain: otherDomain,
      service: otherService,
      internalTokenFn,
      externalTokenFn
    });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      permissions: priviledges.map(priviledge => {
        return { service: otherService, domain: otherDomain, priviledge };
      })
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
