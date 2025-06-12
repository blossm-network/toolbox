const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake, stub, match } = require("sinon");

const deps = require("../deps");
const gateway = require("..");
const allow = "some-allow";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const deletedSceneCheckFn = "some-deleted-scene-check-fn";
const context = "some-context";
const network = "some-network";
const algorithm = "some-algorithm";
const audience = "some-audience";
const procedure = "some-procedure";
const reqContext = "some-req-context";
const internalTokenFn = "some-internal-token-fn";
const nodeExternalTokenFn = "some-node-external-token-fn";
const redirect = "some-redirect";

process.env.CONTEXT = context;
process.env.NETWORK = network;

describe("View gateway", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization-result";
    const channelAuthorizationResultFakeResult =
      "some-channel-authorization-result-fake";
    const channelAuthorizationResultFake = fake.returns(
      channelAuthorizationResultFakeResult
    );
    const authorizationFake = stub()
      .onFirstCall()
      .returns(authorizationResult)
      .onSecondCall()
      .returns(channelAuthorizationResultFake);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake,
    });
    const channelGetFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: channelGetFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const permissionService = "some-permission-service";
    const permissionDomain = "some-permission-domain";
    const permissionPrivilege = "some-permission-privilege";
    const permissions = [
      `${permissionService}:${permissionDomain}:${permissionPrivilege}`,
    ];

    const name = "some-name";
    const views = [{ name, procedure, permissions }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      views,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
      redirect,
    });

    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayGetFake).to.have.been.calledOnce;

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
    expect(channelGetFake).to.have.been.calledWith(deps.channel, {
      path: "/",
      preMiddleware: [
        match((fn) => {
          const req = {
            query: { name, context: reqContext },
          };
          const res = "some-res";
          const next = "some-next";
          const result = fn(req, res, next);
          return (
            result == channelAuthorizationResultFakeResult &&
            authorizationFake.calledWith({
              permissionsLookupFn,
              terminatedSessionCheckFn,
              deletedSceneCheckFn,
              internalTokenFn,
              context,
              permissions: [
                {
                  service: permissionService,
                  domain: permissionDomain,
                  privilege: permissionPrivilege,
                },
              ],
            }) &&
            channelAuthorizationResultFake.calledWith(
              { ...req, context: reqContext },
              res,
              next
            )
          );
        }),
      ],
    });
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name}/:id?`,
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
      permissions: [
        {
          service: permissionService,
          domain: permissionDomain,
          privilege: permissionPrivilege,
        },
      ],
    });
  });
  it("should call with the correct params with no domain or service in env", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization-result";
    const channelAuthorizationResultFakeResult =
      "some-channel-authorization-result-fake";
    const channelAuthorizationResultFake = fake.returns(
      channelAuthorizationResultFakeResult
    );
    const authorizationFake = stub()
      .onFirstCall()
      .returns(authorizationResult)
      .onSecondCall()
      .returns(channelAuthorizationResultFake);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake,
    });
    const channelGetFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: channelGetFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const permissionService = "some-permission-service";
    const permissionDomain = "some-permission-domain";
    const permissionPrivilege = "some-permission-privilege";
    const permissions = [
      `${permissionService}:${permissionDomain}:${permissionPrivilege}`,
    ];
    const name = "some-name";
    const views = [{ name, procedure, permissions }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    delete process.env.DOMAIN;
    delete process.env.SERVICE;
    await gateway({
      views,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      algorithm,
      internalTokenFn,
      nodeExternalTokenFn,
      audience,
      redirect,
    });

    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayGetFake).to.have.been.calledOnce;
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
      path: `/${name}/:id?`,
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
      permissions: [
        {
          service: permissionService,
          domain: permissionDomain,
          privilege: permissionPrivilege,
        },
      ],
    });
  });
  it("should call with the correct params with privileges defaulted to none", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization-result";
    const channelAuthorizationResultFakeResult =
      "some-channel-authorization-result-fake";
    const channelAuthorizationResultFake = fake.returns(
      channelAuthorizationResultFakeResult
    );
    const authorizationFake = stub()
      .onFirstCall()
      .returns(authorizationResult)
      .onSecondCall()
      .returns(channelAuthorizationResultFake);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake,
    });
    const channelGetFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: channelGetFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const name = "some-name";
    const views = [{ name, procedure, context }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      views,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      algorithm,
      internalTokenFn,
      nodeExternalTokenFn,
      audience,
      redirect,
    });

    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });

    expect(gatewayGetFake).to.have.been.calledOnce;
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
      path: `/${name}/:id?`,
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
      permissions: "none",
      context,
    });
  });
  it("should call with the correct params with store key", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization-result";
    const channelAuthorizationResultFakeResult =
      "some-channel-authorization-result-fake";
    const channelAuthorizationResultFake = fake.returns(
      channelAuthorizationResultFakeResult
    );
    const authorizationFake = stub()
      .onFirstCall()
      .returns(authorizationResult)
      .onSecondCall()
      .returns(channelAuthorizationResultFake);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const getFake = fake.returns({
      listen: listenFake,
    });
    const channelGetFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: channelGetFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const permissionService = "some-permission-service";
    const permissionDomain = "some-permission-domain";
    const permissionPrivilege = "some-permission-privilege";
    const permissions = [
      `${permissionService}:${permissionDomain}:${permissionPrivilege}`,
    ];
    const name = "some-name";
    const key = "some-custom-key";
    const views = [{ name, procedure, permissions, key }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      views,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      algorithm,
      internalTokenFn,
      nodeExternalTokenFn,
      audience,
      redirect,
    });
    expect(gatewayGetFake).to.have.been.calledWith({
      name,
      procedure,
      redirect,
      internalTokenFn,
      nodeExternalTokenFn,
      key,
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "strict",
      cookieKey: key,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key });
    expect(channelGetFake).to.have.been.calledWith(deps.channel, {
      path: "/",
      preMiddleware: [
        match((fn) => {
          const req = {
            query: { name, context: reqContext },
          };
          const res = "some-res";
          const next = "some-next";
          const result = fn(req, res, next);
          return (
            result == channelAuthorizationResultFakeResult &&
            authorizationFake.calledWith({
              permissionsLookupFn,
              terminatedSessionCheckFn,
              deletedSceneCheckFn,
              internalTokenFn,
              context,
              permissions: [
                {
                  service: permissionService,
                  domain: permissionDomain,
                  privilege: permissionPrivilege,
                },
              ],
            }) &&
            channelAuthorizationResultFake.calledWith(
              { ...req, context: reqContext },
              res,
              next
            )
          );
        }),
      ],
    });
  });
  it("should call with the correct params with multiple views with different protections and network", async () => {
    const corsMiddlewareFake = fake();
    replace(deps, "corsMiddleware", corsMiddlewareFake);

    const authenticationResult = "some-authentication";
    const authenticationFake = fake.returns(authenticationResult);
    replace(deps, "authentication", authenticationFake);

    const authorizationResult = "some-authorization";
    const authorizationFake = fake.returns(authorizationResult);
    replace(deps, "authorization", authorizationFake);

    const listenFake = fake();
    const thirdGetFake = fake.returns({
      listen: listenFake,
    });
    const secondGetFake = fake.returns({
      get: thirdGetFake,
    });
    const getFake = fake.returns({
      get: secondGetFake,
    });
    const channelGetFake = fake.returns({
      get: getFake,
    });
    const serverFake = fake.returns({
      get: channelGetFake,
    });
    replace(deps, "server", serverFake);

    const gatewayGetResult = "some-get-result";
    const gatewayGetFake = fake.returns(gatewayGetResult);
    replace(deps, "get", gatewayGetFake);

    const permissionService = "some-permission-service";
    const permissionDomain = "some-permission-domain";
    const permissionPrivilege = "some-permission-privilege";
    const permissions = [
      `${permissionService}:${permissionDomain}:${permissionPrivilege}`,
    ];
    const name1 = "some-name1";
    const name2 = "some-name2";
    const name3 = "some-name3";
    const viewNetwork = "some-view-network";
    const views = [
      {
        name: name1,
        procedure,
        protection: "none",
        network: viewNetwork,
      },
      { name: name2, procedure, protection: "none" },
      { name: name3, procedure, permissions },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      views,
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      algorithm,
      internalTokenFn,
      nodeExternalTokenFn,
      audience,
      redirect,
    });

    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name: name1,
      network: viewNetwork,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name: name2,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayGetFake).to.have.been.calledWith({
      procedure,
      redirect,
      name: name3,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayGetFake).to.have.been.calledThrice;
    expect(getFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name1}/:id?`,
      preMiddleware: [authenticationResult],
    });
    expect(secondGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name2}/:id?`,
      preMiddleware: [authenticationResult],
    });
    expect(thirdGetFake).to.have.been.calledWith(gatewayGetResult, {
      path: `/${name3}/:id?`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      audience,
      algorithm,
      protection: "none",
      cookieKey: "access",
    });
    expect(authenticationFake).to.have.been.calledWith({
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
      permissions: [
        {
          service: permissionService,
          domain: permissionDomain,
          privilege: permissionPrivilege,
        },
      ],
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "error-message";
    const serverFake = fake.throws(new Error(errorMessage));
    replace(deps, "server", serverFake);
    try {
      await gateway({
        views: [],
        allow,
        permissionsLookupFn,
        terminatedSessionCheckFn,
        deletedSceneCheckFn,
        algorithm,
      });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
