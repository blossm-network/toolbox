const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const eventStores = require("..");

const deps = require("../deps");

let clock;

const now = new Date();

const key = "some-key";

const envService = "some-env-service";

process.env.SERVICE = envService;

const context = { a: "some-context" };
const claims = "some-claims";
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
    const result = await eventStores(storeQueries)
      .set({
        context,
        claims,
        token: {
          internalFn: internalTokenFn,
          externalFn: externalTokenFn,
          key,
        },
      })
      .stream(fn, sortFn);

    expect(streamFake).to.have.been.calledWith(storeQueries, fn, sortFn);
    expect(inFake).to.have.been.calledWith({
      context,
    });
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
      internalTokenFn,
      externalTokenFn,
      key,
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
    const result = await eventStores(storeQueries).stream(fn, sortFn);

    expect(streamFake).to.have.been.calledWith(storeQueries, fn, sortFn);
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      path: "/stream",
    });
    expect(result).to.equal(stream);
  });
});
