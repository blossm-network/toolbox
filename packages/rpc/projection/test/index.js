const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const projection = require("..");

const name = "some-name";
const domain = "some-domain";
const service = "some-service";
const eventsDomain = "some-events-domain";
const eventsService = "some-events-service";

const internalTokenFn = "some-internal-token-fn";

const from = "some-from";
const root = "some-root";

describe("Replay projection", () => {
  afterEach(() => {
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

    const { body: result } = await projection({
      name,
      context,
      domain,
      service,
      eventsDomain,
      eventsService,
    })
      .set({
        tokenFns: { internal: internalTokenFn },
      })
      .replay(root, { from });

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      domain,
      service,
      context,
      eventsDomain,
      eventsService,
      "projection"
    );
    expect(postFake).to.have.been.calledWith({
      forceFrom: from,
      root,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
    });
  });
  it("should call with the correct params with optionals omitted", async () => {
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

    const { body: result } = await projection({
      name,
      context,
      eventsDomain,
      eventsService,
    })
      .set({
        tokenFns: { internal: internalTokenFn },
      })
      .replay(root);

    expect(result).to.equal(response);
    expect(rpcFake).to.have.been.calledWith(
      name,
      context,
      eventsDomain,
      eventsService,
      "projection"
    );
    expect(postFake).to.have.been.calledWith({
      forceFrom: 0,
      root,
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith({
      internalTokenFn,
    });
  });
});
