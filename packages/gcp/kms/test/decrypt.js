const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { decrypt } = require("..");

const kms = require("@google-cloud/kms");

const gcpProject = "some-gcp-project";
const keyRing = "some-key-ring";
const key = "some-key";
const keyLocation = "some-key-location";

const message = "This is my message to sign";

describe("Kms decrypt", () => {
  beforeEach(() => {
    process.env.GCP_PROJECT = gcpProject;
    process.env.GCP_KMS_KEY_RING = keyRing;
    process.env.GCP_KMS_KEY = key;
    process.env.GCP_KMS_KEY_LOCATION = keyLocation;
  });
  afterEach(() => {
    restore();
  });
  it("should decrypt correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const decrpytedMessage = "some-decrypted-message";
    const decryptFake = fake.returns([decrpytedMessage]);
    kmsClient.prototype.decrypt = decryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await decrypt(message);
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      keyLocation,
      keyRing,
      key
    );
    expect(result).to.equal(decrpytedMessage);
    expect(decryptFake).to.have.been.calledWith({
      name: path,
      message
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const decryptFake = fake.rejects("some error");
    kmsClient.prototype.decrypt = decryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    expect(async () => await decrypt(message)).to.throw;
  });
});
