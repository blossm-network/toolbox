const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const getViews = require("..");

const id = "some-id!";
const domain = "some-domain!";
const service = "some-service";
const network = "some-network";

const tokenFn = "some-token-fn";

const query = "some-query";
const context = { c: 2 };

describe("Get views", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const on = fake();
    const get = fake.returns({
      on
    });
    const operation = fake.returns({
      get
    });
    replace(deps, "operation", operation);

    await getViews({ id, domain, service, network })
      .with({ query, tokenFn })
      .in(context);

    expect(operation).to.have.been.calledWith(`${id}.${domain}`);
    expect(get).to.have.been.calledWith({
      data: query,
      context,
      tokenFn
    });
    expect(on).to.have.been.calledWith({ service, network });
  });
});
