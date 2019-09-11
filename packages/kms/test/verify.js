const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { sign, verify } = require("..");
const crypto = require("crypto");

const kms = require("@google-cloud/kms");

const gcpProject = "some-gcp-project";
const pem = "some-pem";
const message = "some message";
const signature = "some-signature";

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "/Users/joao/.config/gcloud/core-staging-3ea7929ce368.json";

describe("Kms verify", () => {
  beforeEach(() => {
    process.env.GCP_PROJECT = gcpProject;
  });
  afterEach(() => {
    restore();
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.rejects("some-error");
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    expect(async () => await verify({ message, signature })).to.throw;
  });
  it("should get the public key correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);

    const isVerified = "some-result";
    const verifyFake = fake.returns(isVerified);
    const updateFake = fake.returns({
      verify: verifyFake
    });
    const createVerifyFake = fake.returns({
      update: updateFake
    });
    replace(crypto, "createVerify", createVerifyFake);

    const result = await verify({ message, signature });

    expect(result).to.equal(isVerified);
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      "global",
      "core",
      "auth",
      "1"
    );
    expect(createVerifyFake).to.have.been.calledWith("SHA256");
    expect(getKeyFake).to.have.been.calledWith({ name: path });
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(pem, signature, "uncompressed");
  });
  it("shouldn't call the service if the key has already been retrieved", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const isVerified = "some-result";
    const verifyFake = fake.returns(isVerified);
    const updateFake = fake.returns({
      verify: verifyFake
    });
    const createVerifyFake = fake.returns({
      update: updateFake
    });
    replace(crypto, "createVerify", createVerifyFake);
    const result = await verify({ message, signature });

    expect(result).to.equal(isVerified);
    expect(getKeyFake).to.have.not.been.called;
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(pem, signature, "uncompressed");
    expect(pathFake).to.have.not.been.called;
  });

  it("should sign and verify correctly", async () => {
    const message = "I am a message";

    process.env.GCP_PROJECT = "smn-core-staging";
    const signature = await sign(message);
    const result = await verify({ message, signature });
    expect(result).to.be.true;
  });
  it("should fail if messages dont match", async () => {
    const message = "I am a message";

    process.env.GCP_PROJECT = "smn-core-staging";
    const signature = await sign(message);
    const result = await verify({ message: `${message}-`, signature });
    expect(result).to.be.false;
  });
});
