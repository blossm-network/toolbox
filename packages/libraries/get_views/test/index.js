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
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      get: getFake
    });
    replace(deps, "operation", operationFake);

    await getViews({ id, domain, service, network })
      .for(query)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(`${id}.view-store.${domain}`);
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });
});
