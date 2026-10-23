import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { restore, replace, fake, useFakeTimers } from "sinon";
import eventStores from "../index.js";
import deps from "../deps.js";

chai.use(chaiDatetime);
chai.use(sinonChai);

const { expect } = chai;

let clock;

const now = new Date();

const envService = "some-env-service";
const envRegion = "some-env-region";

process.env.SERVICE = envService;
process.env.GCP_REGION = envRegion;

const context = { a: "some-context" };
const claims = "some-claims";
const region = "some-region";
const internalTokenFn = "some-internal-token-fn";
const externalTokenFn = "some-external-token-fn";

describe("Event store", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call stream with the right params", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });

    replace(deps, "stream", streamFake);

    const fn = "some-fn";
    const sortFn = "some-sort-fn";

    const storeQueries = [{ domain: "account", service: "core", query: {} }];
    const result = await eventStores({storeQueries, region})
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
        },
      })
      .stream(fn, sortFn);

    expect(streamFake).to.have.been.calledWith({ region, operationNameComponentQueries: [{ operationNameComponents: ["account", "core", "event-store"], query: {} }], fn, sortFn });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream-aggregates",
      internalTokenFn,
      externalTokenFn,
      claims,
    });
    expect(result).to.equal(stream);
  });
  it("should call stream with the right params with optionals missing", async () => {
    const stream = "some-stream";
    const withFake = fake.returns(stream);
    const inFake = fake.returns({
      with: withFake,
    });
    const streamFake = fake.returns({
      in: inFake,
    });

    replace(deps, "stream", streamFake);

    const fn = "some-fn";
    const sortFn = "some-sort-fn";

    const storeQueries = [{ domain: "account", service: "core", query: {} }];
    const result = await eventStores({storeQueries}).stream(fn, sortFn);

    expect(streamFake).to.have.been.calledWith({ region: envRegion, operationNameComponentQueries: [{ operationNameComponents: ["account", "core", "event-store"], query: {} }], fn, sortFn });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream-aggregates",
    });
    expect(result).to.equal(stream);
  });
});

describe("Multiple event-store RPC composition", () => {
  afterEach(restore);

  it("targets the deployed aggregate stream with real identity helpers and optional tokens", async () => {
    const { default: stream } = await import("../../stream/index.js");
    const { default: streamDeps } = await import("../../stream/deps.js");
    const { default: hash } = await import("../../../lib/operation_hash/index.js");
    const { default: shortName } = await import("../../../lib/operation_short_name/index.js");
    replace(deps, "stream", stream);
    const streamMany = fake.resolves();
    replace(streamDeps, "streamMany", streamMany);
    const query = Object.freeze({ root: "root", timestamp: "2026-10-22" });
    await eventStores({ storeQueries: [{ domain: "account", service: "core", query }], region: "region" }).stream(() => undefined);
    const parts = ["account", "core", "event-store"];
    expect(streamMany.firstCall.args[0]).to.deep.equal([{
      url: `https://region-${shortName(parts)}-${hash(...parts)}-${process.env.GCP_COMPUTE_URL_ID}.region.run.app/stream-aggregates`,
      query,
    }]);
    expect(streamMany.firstCall.args[3].decode).to.be.a("function");
  });
});
