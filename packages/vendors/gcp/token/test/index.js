const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const gcpToken = require("..");

const hash = "some-operation-hash";

const gcpRegion = "some-region";
const gcpComputeUrlId = "some-gcp-compute-url-id";
const name = "some-name";

process.env.GCP_REGION = gcpRegion;
process.env.GCP_COMPUTE_URL_ID = gcpComputeUrlId;

describe("Gcp token", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly in staging", async () => {
    process.env.NODE_ENV = "staging";

    const body = "some-body";
    const response = {
      body
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.equal(body);
  });
  it("should call correctly with error", async () => {
    process.env.NODE_ENV = "staging";

    const response = {
      statusCode: 300
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.be.null;
  });
});
