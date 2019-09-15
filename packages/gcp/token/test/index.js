const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const gcpToken = require("..");

describe("Gcp token", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const body = "some-body";
    const response = {
      body
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const url = "some-url";
    const result = await gcpToken({ url });

    expect(getFake).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      null,
      { "Metadata-Flavor": "Google" }
    );
    expect(result).to.equal(body);
  });
});
