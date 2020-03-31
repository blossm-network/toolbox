const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const deps = require("../deps");
const command = require("..");

let clock;

const now = new Date();

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

const payload = { a: 1 };
const options = "some-options";
const trace = "some-trace";
const tokenFn = "some-token-fn";
const issued = "some-issued";

const context = { c: 2 };
const claims = "some-claims";

const root = "some-root";

const envService = "Some-env-service";
const envName = "Some-env-name";
const envHost = "some-env-host";
const envProcedure = "some-env-procedure";
const envDomain = "some-env-domain";
const envHash = "some-env-hash";

const routerNetwork = "some-router-network";

process.env.SERVICE = envService;
process.env.NETWORK = network;
process.env.NAME = envName;
process.env.HOST = envHost;
process.env.DOMAIN = envDomain;
process.env.PROCEDURE = envProcedure;
process.env.OPERATION_HASH = envHash;
process.env.ROUTER_NETWORK = routerNetwork;

describe("Issue command", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const path = ["some-path"];
    const result = await command({ name, domain, service, network })
      .set({ context, claims, tokenFn })
      .issue(payload, {
        trace,
        issued,
        path,
        root,
        options
      });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "command-handler"
    );
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued,
        trace,
        path: [
          "some-path",
          {
            timestamp: deps.dateString(),
            issued,
            procedure: envProcedure,
            hash: envHash,
            network,
            host: envHost,
            name: envName,
            domain: envDomain,
            service: envService
          }
        ]
      },
      root,
      options
    });
    expect(inFake).to.have.been.calledWith({
      context
    });
    expect(withFake).to.have.been.calledWith({ tokenFn, claims });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await command({ name, domain }).issue(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, envService);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: deps.dateString(),
        path: [
          {
            timestamp: deps.dateString(),
            procedure: envProcedure,
            hash: envHash,
            network,
            host: envHost,
            name: envName,
            domain: envDomain,
            service: envService
          }
        ]
      }
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });
  it("should call with the correct params onto a different network with an antenna", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const otherNetwork = "some-other-network";

    const result = await command({
      name,
      domain,
      service,
      network: otherNetwork
    })
      .set({ context, claims, tokenFn })
      .issue(payload, { trace, issued, root, options });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "command-handler"
    );
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued,
        trace,
        path: [
          {
            timestamp: deps.dateString(),
            issued,
            procedure: envProcedure,
            hash: envHash,
            network,
            host: envHost,
            name: envName,
            domain: envDomain,
            service: envService
          }
        ]
      },
      root,
      options,
      destination: {
        name,
        domain,
        service,
        network: otherNetwork
      }
    });
    expect(inFake).to.have.been.calledWith({
      context,
      host: `command.antenna.${routerNetwork}`
    });
    expect(withFake).to.have.been.calledWith({
      tokenFn,
      claims,
      path: "/some-name"
    });
  });
  it("should call with the correct params onto a different network with route as false", async () => {
    const response = "some-response";
    const withFake = fake.returns(response);
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const otherNetwork = "some-other-network";

    const result = await command({
      name,
      domain,
      service,
      network: otherNetwork
    })
      .set({ context, claims, tokenFn, route: false })
      .issue(payload, { trace, issued, root, options });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      "command-handler"
    );
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued,
        trace,
        path: [
          {
            timestamp: deps.dateString(),
            issued,
            procedure: envProcedure,
            hash: envHash,
            network,
            host: envHost,
            name: envName,
            domain: envDomain,
            service: envService
          }
        ]
      },
      root,
      options
    });
    expect(inFake).to.have.been.calledWith({
      context,
      host: "command.some-domain.some-service.some-other-network"
    });
    expect(withFake).to.have.been.calledWith({
      tokenFn,
      claims,
      path: "/some-name"
    });
  });
});
