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

    const storeQueries = "some-store-queries";
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

    expect(streamFake).to.have.been.calledWith({ region, storeQueries, fn, sortFn });
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
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

    const storeQueries = "some-store-queries";
    const result = await eventStores({storeQueries}).stream(fn, sortFn);

    expect(streamFake).to.have.been.calledWith({ region: envRegion, storeQueries, fn, sortFn });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
    });
    expect(result).to.equal(stream);
  });
});
