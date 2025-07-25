import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import viewComposite from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const name = "some-name";
const context = "some-context";
const region = "some-region";

const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";
const currentToken = "some-current-token";

const query = "some-query";
const sort = "some-sort";
const root = "some-root";
const contexts = { c: 2 };

const envContext = "some-env-context";
const envRegion = "some-env-region";

process.env.CONTEXT = envContext;
process.env.GCP_REGION = envRegion;

describe("Get composite views", () => {
  afterEach(() => {
    restore();
  });

  it("should call read with the correct params", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const { body: result } = await viewComposite({
      name,
      context,
      region,
    })
      .set({
        context: contexts,
        currentToken,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
        },
      })
      .read({ query, sort, root });

    expect(rpcFake).to.have.been.calledWith({
      region,
      operationNameComponents: [name, context, "view-composite"]
    });
    expect(getFake).to.have.been.calledWith({ query, sort, id: root });
    expect(inFake).to.have.been.calledWith({ context: contexts });
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
      externalTokenFn,
      currentToken,
    });
    expect(result).to.equal(view);
  });
  it("should call read with the correct params and optionals omitted", async () => {
    const view = "some-view";
    const withFake = fake.returns({ body: view });
    const inFake = fake.returns({
      with: withFake,
    });
    const getFake = fake.returns({
      in: inFake,
    });
    const rpcFake = fake.returns({
      get: getFake,
    });
    replace(deps, "rpc", rpcFake);

    const result = await viewComposite({ name }).read({ query });

    expect(rpcFake).to.have.been.calledWith({
      region: envRegion,
      operationNameComponents: [name, envContext, "view-composite"]
    });
    expect(getFake).to.have.been.calledWith({ query });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({});
    expect(result).to.deep.equal({ body: view });
  });
  // it("should call stream with the correct params", async () => {
  //   const view = "some-view";
  //   const withFake = fake.returns({ body: view });
  //   const inFake = fake.returns({
  //     with: withFake,
  //   });
  //   const streamFake = fake.returns({
  //     in: inFake,
  //   });
  //   const rpcFake = fake.returns({
  //     stream: streamFake,
  //   });
  //   replace(deps, "rpc", rpcFake);

  //   const fn = "some-fn";
  //   const { body: result } = await viewComposite({
  //     name,
  //     domain,
  //     service,
  //     context,
  //   })
  //     .set({
  //       context: contexts,
  //       currentToken,
  //       token: {
  //         internalFn: internalTokenFn,
  //         externalFn: externalTokenFn,
  //       },
  //     })
  //     .stream(fn, { query, sort, root });

  //   expect(rpcFake).to.have.been.calledWith(
  //     name,
  //     domain,
  //     service,
  //     context,
  //     "view-composite"
  //   );
  //   expect(streamFake).to.have.been.calledWith(fn, { query, sort, id: root });
  //   expect(inFake).to.have.been.calledWith({ context: contexts });
  //   expect(withFake).to.have.been.calledWith({
  //     path: "/stream",
  //     internalTokenFn,
  //     externalTokenFn,
  //     currentToken,
  //     key,
  //   });
  //   expect(result).to.equal(view);
  // });
  // it("should call stream with the correct params and optionals omitted", async () => {
  //   const view = "some-view";
  //   const withFake = fake.returns({ body: view });
  //   const inFake = fake.returns({
  //     with: withFake,
  //   });
  //   const streamFake = fake.returns({
  //     in: inFake,
  //   });
  //   const rpcFake = fake.returns({
  //     stream: streamFake,
  //   });
  //   replace(deps, "rpc", rpcFake);

  //   const fn = "some-fn";
  //   const result = await viewComposite({ name }).stream(fn, {
  //     query,
  //   });

  //   expect(rpcFake).to.have.been.calledWith(name, envContext, "view-composite");
  //   expect(streamFake).to.have.been.calledWith(fn, { query });
  //   expect(inFake).to.have.been.calledWith({});
  //   expect(withFake).to.have.been.calledWith({
  //     path: "/stream",
  //   });
  //   expect(result).to.deep.equal({ body: view });
  // });
});
