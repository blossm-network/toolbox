const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const gcpToken = require("..");

const hash = "some-operation-hash";

const gcpRegion = "some-region";
const gcpDevelopmentComputeUrlId = "some-gcp-development-compute-url-id";
const gcpProductionComputeUrlId = "some-gcp-production-compute-url-id";
const gcpSandboxComputeUrlId = "some-gcp-sandbox-compute-url-id";
const gcpStagingComputeUrlId = "some-gcp-compute-url-id";
const name = "some-name";

process.env.GCP_REGION = gcpRegion;
process.env.GCP_DEVELOPMENT_COMPUTE_URL_ID = gcpDevelopmentComputeUrlId;
process.env.GCP_PRODUCTION_COMPUTE_URL_ID = gcpProductionComputeUrlId;
process.env.GCP_SANDBOX_COMPUTE_URL_ID = gcpSandboxComputeUrlId;
process.env.GCP_STAGING_COMPUTE_URL_ID = gcpStagingComputeUrlId;

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

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpStagingComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.equal(body);
  });
  it("should call correctly in sandbox", async () => {
    process.env.NODE_ENV = "sandbox";

    const body = "some-body";
    const response = {
      body
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpSandboxComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.equal(body);
  });
  it("should call correctly in production", async () => {
    process.env.NODE_ENV = "production";

    const body = "some-body";
    const response = {
      body
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpProductionComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.equal(body);
  });
  it("should call correctly in another environment", async () => {
    process.env.NODE_ENV = "local";

    const body = "some-body";
    const response = {
      body
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });
    expect(result).to.be.null;
  });
  it("should call correctly with error", async () => {
    process.env.NODE_ENV = "staging";

    const response = {
      statusCode: 300
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpStagingComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.be.null;
  });
});
