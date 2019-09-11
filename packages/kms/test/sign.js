const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const crypto = require("crypto");
const { sign } = require("..");

const kms = require("@google-cloud/kms");

const gcpProject = "some-gcp-project";

const message = "This is my message to sign";
describe("Kms sign", () => {
  beforeEach(() => {
    process.env.GCP_PROJECT = gcpProject;
  });
  afterEach(() => {
    restore();
  });
  it("should sign correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const signature = "some-sig";
    const signFake = fake.returns([{ signature }]);
    kmsClient.prototype.asymmetricSign = signFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256
        };
      }
    });
    replace(crypto, "createHash", createHashFake);
    const result = await sign(message);
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      "global",
      "core",
      "auth",
      "1"
    );
    expect(result).to.equal(signature);
    expect(signFake).to.have.been.calledWith({
      name: path,
      digest: {
        sha256
      }
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const signFake = fake.rejects("some error");
    kmsClient.prototype.asymmetricSign = signFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256
        };
      }
    });
    replace(crypto, "createHash", createHashFake);
    expect(async () => await sign(message)).to.throw;
  });
});
