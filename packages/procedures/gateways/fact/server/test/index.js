const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, match } = require("sinon");

const deps = require("../deps");
const gateway = require("..");
const allow = "some-allow";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const deletedSceneCheckFn = "some-deleted-scene-check-fn";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const context = "some-context";
const algorithm = "some-algorithm";
const internalTokenFn = "some-internal-token-fn";
const nodeExternalTokenFn = "some-node-external-token-fn";
const audience = "some-audience";

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Fact gateway", () => {
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
    const secondGetFake = fake.returns({
      listen: listenFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name = "some-name";
    const facts = [{ name, privileges, context }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      facts,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
    });

    expect(gatewayGetFake.getCall(0)).to.have.been.calledWith({
      name,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: false,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(1)).to.have.been.calledWith({
      name,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: true,
      raw: false,
      root: false,
    });
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
          credentials: true,
          methods: ["GET"],
        });
      }),
    });
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name}/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(secondGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name}/stream/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: "access",
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
    });
  });
  it("should call with the correct params with gateway services", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const secondGetFake = fake.returns({
      listen: listenFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name = "some-name";
    const facts = [{ name, privileges, context, local: true }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    const nameService = "some-name-service";
    const serviceFake = fake.returns(nameService);
    const services = {
      [name]: serviceFake,
    };
    await gateway({
      facts,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
      services,
    });

    expect(gatewayGetFake).to.not.have.been.called;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
          credentials: true,
          methods: ["GET"],
        });
      }),
    });
    expect(getFake).to.have.been.calledWith(nameService, {
      path: `/${name}/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(secondGetFake).to.have.been.calledWith(nameService, {
      path: `/${name}/stream/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(serviceFake).to.have.been.calledWith({ internalTokenFn });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: "access",
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
    });
  });
  it("should call with the correct params with privileges set to none and custom key, with raw, root, service and network passed back", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const secondGetFake = fake.returns({
      listen: listenFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privileges = "none";
    const name = "some-name";
    const key = "some-custom-key";
    const factNetwork = "some-fact-network";
    const factService = "some-fact-service";
    const raw = "some-raw";
    const root = "some-root";
    const facts = [
      {
        name,
        privileges,
        context,
        key,
        network: factNetwork,
        service: factService,
        raw,
        root,
      },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      facts,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
    });

    expect(gatewayGetFake.getCall(0)).to.have.been.calledWith({
      name,
      domain,
      service: factService,
      network: factNetwork,
      internalTokenFn,
      nodeExternalTokenFn,
      key,
      stream: false,
      raw,
      root,
    });
    expect(gatewayGetFake.getCall(1)).to.have.been.calledWith({
      name,
      domain,
      service: factService,
      network: factNetwork,
      internalTokenFn,
      nodeExternalTokenFn,
      key,
      stream: true,
      raw,
      root,
    });
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
          credentials: true,
          methods: ["GET"],
        });
      }),
    });
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name}/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(secondGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name}/stream/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: key,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      permissions: "none",
      context,
    });
  });
  it("should call with the correct params with job key", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const secondGetFake = fake.returns({
      listen: listenFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name = "some-name";
    const key = "some-key";
    const facts = [{ name, privileges, key }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      facts,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: key,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key });
  });
  it("should call with the correct params with multiple facts with different protections", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const sixthGetFake = fake.returns({
      listen: listenFake,
    });
    const fifthGetFake = fake.returns({
      get: sixthGetFake,
    });
    const fourthGetFake = fake.returns({
      get: fifthGetFake,
    });
    const thirdGetFake = fake.returns({
      get: fourthGetFake,
    });
    const secondGetFake = fake.returns({
      get: thirdGetFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name1 = "some-name1";
    const name2 = "some-name2";
    const name3 = "some-name3";
    const facts = [
      { name: name1, protection: "none" },
      { name: name2, protection: "context" },
      { name: name3, privileges, context },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      facts,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
    });

    expect(gatewayGetFake.getCall(0)).to.have.been.calledWith({
      name: name1,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: false,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(1)).to.have.been.calledWith({
      name: name1,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: true,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(2)).to.have.been.calledWith({
      name: name2,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: false,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(3)).to.have.been.calledWith({
      name: name2,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: true,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(4)).to.have.been.calledWith({
      name: name3,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: false,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(5)).to.have.been.calledWith({
      name: name3,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: true,
      raw: false,
      root: false,
    });
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name1}/:root?`,
    });
    expect(secondGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name1}/stream/:root?`,
    });
    expect(thirdGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name2}/:root?`,
      preMiddleware: [authenticationResult],
    });
    expect(fourthGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name2}/stream/:root?`,
      preMiddleware: [authenticationResult],
    });
    expect(fifthGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name3}/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(sixthGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name3}/stream/:root?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake.getCall(0)).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "context",
      cookieKey: "access",
    });
    expect(authenticationFake.getCall(1)).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: "access",
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledOnce;
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
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
    const secondGetFake = fake.returns({
      listen: listenFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const serverFake = fake.returns({
      get: getFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const privilege = "some-privilege";
    const privileges = [privilege];
    const name = "some-name";
    const facts = [{ name, privileges, context }];

    const otherDomain = "some-other-domain";
    const otherService = "some-other-service";

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      facts,
      domain: otherDomain,
      service: otherService,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
    });

    expect(gatewayGetFake.getCall(0)).to.have.been.calledWith({
      name,
      domain: otherDomain,
      service: otherService,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: false,
      raw: false,
      root: false,
    });
    expect(gatewayGetFake.getCall(1)).to.have.been.calledWith({
      name,
      domain: otherDomain,
      service: otherService,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      stream: true,
      raw: false,
      root: false,
    });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
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
        facts: [],
        allow,
        permissionsLookupFn,
        terminatedSessionCheckFn,
        deletedSceneCheckFn,
        internalTokenFn,
        nodeExternalTokenFn,
        algorithm,
        audience,
      });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
