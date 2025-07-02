import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake, replace } from "sinon";
import deps from "../deps.js";
import gcpToken from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

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
      body,
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.deep.equal({ token: body, type: "Bearer" });
  });
  it("should call correctly with error", async () => {
    process.env.NODE_ENV = "staging";

    const response = {
      statusCode: 300,
    };
    const getFake = fake.returns(response);
    replace(deps, "get", getFake);

    const result = await gcpToken({ hash, name });

    const url = `https://${gcpRegion}-${name}-${hash}-${gcpComputeUrlId}-uc.a.run.app`;

    expect(
      getFake
    ).to.have.been.calledWith(
      `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${url}`,
      { headers: { "Metadata-Flavor": "Google" } }
    );
    expect(result).to.be.null;
  });
});
