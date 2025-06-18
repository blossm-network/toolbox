import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiDatetime from "chai-datetime";
import { restore, replace, fake, useFakeTimers } from "sinon";

import deps from "../deps.js";
import command from "../index.js";

chai.use(sinonChai);
chai.use(chaiDatetime);

const { expect } = chai;

let clock;

const now = new Date();

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";

const payload = { a: 1 };
const options = "some-options";
const id = "some-id";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

const context = { c: 2 };
const claims = "some-claims";
const currentToken = "some-current-token";

const root = "some-root";

const envService = "Some-env-service";
const envName = "Some-env-name";
const envHost = "some-env-host";
const envProcedure = "some-env-procedure";
const envDomain = "some-env-domain";
const envHash = "some-env-hash";

process.env.SERVICE = envService;
process.env.NETWORK = network;
process.env.NAME = envName;
process.env.HOST = envHost;
process.env.DOMAIN = envDomain;
process.env.PROCEDURE = envProcedure;
process.env.OPERATION_HASH = envHash;

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
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const path = ["some-path"];
    const ip = "some-ip";
    const idempotency = "some-idempotency";
    const enqueueFnResult = "some-enqueue-fn-result";
    const enqueueFnFake = fake.returns(enqueueFnResult);
    const enqueueWait = "some-enqueue-wait";
    const { body: result } = await command({ name, domain, service, network })
      .set({
        context,
        claims,
        currentToken,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
        },
        enqueue: {
          fn: enqueueFnFake,
          wait: enqueueWait,
        },
      })
      .issue(payload, {
        headers: {
          idempotency,
        },
        tx: {
          id,
          ip,
          path,
        },
        root,
        options,
      });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "command");
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: deps.dateString(),
        idempotency,
      },
      tx: {
        ip,
        id,
        path,
      },
      root,
      options,
    });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      currentToken,
      claims,
      enqueueFn: enqueueFnResult,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      queue: `command-${service}-${domain}-${name}`,
      wait: enqueueWait,
    });
  });
  it("should call with the correct optional params", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const { body: result } = await command({ name, domain }).issue(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, envService);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: deps.dateString(),
      },
      tx: {},
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
  });
  it("should call with the correct optional params with queue fn", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const enqueueFnResult = "some-enqueue-fn-result";
    const enqueueFnFake = fake.returns(enqueueFnResult);
    const { body: result } = await command({ name, domain })
      .set({ enqueue: { fn: enqueueFnFake } })
      .issue(payload);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, envService);
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: deps.dateString(),
      },
      tx: {},
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      enqueueFn: enqueueFnResult,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      queue: `command-${envService}-${domain}-${name}`,
    });
  });
  it("should call with the correct params onto a different network", async () => {
    const response = "some-response";
    const withFake = fake.returns({ body: response });
    const inFake = fake.returns({
      with: withFake,
    });
    const postFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      post: postFake,
    });
    replace(deps, "rpc", rpcFake);

    const otherNetwork = "some-other-network";

    const { body: result } = await command({
      name,
      domain,
      service,
      network: otherNetwork,
    })
      .set({ context, claims, token: { externalFn: externalTokenFn } })
      .issue(payload, { root, options });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(name, domain, service, "command");
    expect(postFake).to.have.been.calledWith({
      payload,
      headers: {
        issued: deps.dateString(),
      },
      tx: {},
      root,
      options,
    });
    expect(inFake).to.have.been.calledWith({
      context,
      network: otherNetwork,
      host: `c.some-domain.some-service.some-other-network`,
    });
    expect(withFake).to.have.been.calledWith({
      externalTokenFn,
      claims,
      path: "/some-name",
    });
  });
});
