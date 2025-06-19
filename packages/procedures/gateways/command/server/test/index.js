import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, match } from "sinon";

import deps from "../deps.js";
import gateway from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const allow = "some-allow";
const permissionsLookupFn = "some-permissions-fn";
const terminatedSessionCheckFn = "some-terminated-session-check-fn";
const deletedSceneCheckFn = "some-deleted-scene-check-fn";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const context = "some-context";
const algorithm = "some-algorithm";
const keyClaimsFn = "some-token-claims-fn";
const internalTokenFn = "some-internal-token-fn";
const nodeExternalTokenFn = "some-node-external-token-fn";
const audience = "some-audience";
const redirect = "some-redirect";

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
    const commands = [{ name, privileges, context }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      allow,
      internalTokenFn,
      nodeExternalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
      redirect,
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      redirect,
    });
    expect(gatewayPostFake).to.have.been.calledOnce;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
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
      protection: "strict",
      allowBasic: false,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      node: false,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
      context,
    });
  });
  it("should call with the correct params with services", async () => {
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
    const commands = [{ name, privileges, context, local: true }];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    const nameService = "some-name-service";
    const serviceFake = fake.returns(nameService);
    const services = {
      [name]: serviceFake,
    };
    await gateway({
      commands,
      allow,
      internalTokenFn,
      nodeExternalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
      redirect,
      services,
    });

    expect(gatewayPostFake).to.not.have.been.called;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
          credentials: true,
          methods: ["POST"],
        });
      }),
    });
    expect(postFake).to.have.been.calledWith(nameService, {
      path: `/${name}`,
      preMiddleware: [authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      audience,
      algorithm,
      protection: "strict",
      allowBasic: false,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(serviceFake).to.have.been.calledWith({ internalTokenFn });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      node: false,
      permissions: privileges.map((privilege) => {
        return { service, domain, privilege };
      }),
      context,
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
    const commands = [
      {
        name,
        network,
        privileges,
        context,
        basic: true,
        node: true,
        multipart: true,
      },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    const anyResult = "some-any-results";
    const anyFake = fake.returns(anyResult);

    replace(deps, "uploader", {
      any: anyFake,
    });

    await gateway({
      commands,
      allow,
      internalTokenFn,
      nodeExternalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      algorithm,
      audience,
      redirect,
    });

    expect(anyFake).to.have.been.calledWith();
    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      network,
      service,
      domain,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      redirect,
    });
    expect(gatewayPostFake).to.have.been.calledOnce;
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith({
      prehook: match((fn) => {
        const app = "some-app";
        fn(app);
        return corsMiddlewareFake.calledWith({
          app,
          allow,
          credentials: true,
          methods: ["POST"],
        });
      }),
    });
    expect(postFake).to.have.been.calledWith(gatewayPostResult, {
      path: `/${name}`,
      preMiddleware: [anyResult, authenticationResult, authorizationResult],
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      audience,
      algorithm,
      protection: "strict",
      allowBasic: true,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
      permissions: "none",
      node: true,
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
      allow,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      internalTokenFn,
      nodeExternalTokenFn,
      algorithm,
      audience,
      redirect,
      context,
    });

    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: key,
      keyClaimsFn,
      audience,
      algorithm,
      protection: "strict",
      allowBasic: false,
    });

    expect(verifyFnFake).to.have.been.calledWith({ key });
    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain,
      service: otherService,
      internalTokenFn,
      nodeExternalTokenFn,
      key,
      redirect,
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
      { name: name2, privileges, context },
    ];

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      allow,
      internalTokenFn,
      nodeExternalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
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
      nodeExternalTokenFn,
      key: "access",
    });
    expect(gatewayPostFake.getCall(1)).to.have.been.calledWith({
      name: name2,
      domain,
      service,
      internalTokenFn,
      nodeExternalTokenFn,
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
      protection: "strict",
      allowBasic: false,
    });
    expect(authenticationFake).to.have.been.calledWith({
      verifyFn: verifyFnResult,
      cookieKey: "access",
      keyClaimsFn,
      algorithm,
      audience,
      protection: "none",
      allowBasic: false,
    });
    expect(verifyFnFake).to.have.been.calledWith({ key: "access" });
    expect(authorizationFake).to.have.been.calledOnce;
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
      node: false,
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
    const commands = [{ name, privileges, context }];

    const otherDomain = "some-other-domain";
    const otherService = "some-other-service";

    const verifyFnResult = "some-verify-fn";
    const verifyFnFake = fake.returns(verifyFnResult);

    await gateway({
      commands,
      domain: otherDomain,
      service: otherService,
      allow,
      internalTokenFn,
      nodeExternalTokenFn,
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      verifyFn: verifyFnFake,
      keyClaimsFn,
      redirect,
    });

    expect(gatewayPostFake).to.have.been.calledWith({
      name,
      domain: otherDomain,
      service: otherService,
      internalTokenFn,
      nodeExternalTokenFn,
      key: "access",
      redirect,
    });
    expect(authorizationFake).to.have.been.calledWith({
      permissionsLookupFn,
      terminatedSessionCheckFn,
      deletedSceneCheckFn,
      internalTokenFn,
      context,
      node: false,
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
        allow,
        permissionsLookupFn,
        terminatedSessionCheckFn,
        deletedSceneCheckFn,
      });
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
