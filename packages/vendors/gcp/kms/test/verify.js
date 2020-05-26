//ovveride process.env with local .env file.
// const fs = require("fs");

// if (fs.existsSync(".blossm-application-credentials.json")) {
//   const dotenv = require("dotenv");
//   const envConfig = dotenv.parse(fs.readFileSync(".env"));
//   for (const k in envConfig) {
//     process.env[k] = envConfig[k];
//   }
// }

const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { /*sign,*/ verify } = require("..");
const crypto = require("crypto");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";
const version = "some-key-version";
const pem = "some-pem";
const message = "some message";
const signature = "some-signature";

// const actualProject = "blossm";
// const actualLocation = "global";
// const actualRing = "test-ring";
// const actualKey = "test-key";
// const actualVersion = "1";

describe("Kms verify", () => {
  afterEach(() => {
    restore();
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;

    const errorMessage = "some-error-message";
    const getKeyFake = fake.rejects(new Error(errorMessage));
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);

    try {
      await verify({ key, ring, location, version, project })({
        message,
        signature,
      });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should get the public key correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);

    const isVerified = "some-result";
    const verifyFake = fake.returns(isVerified);
    const updateFake = fake.returns({
      verify: verifyFake,
    });
    const createVerifyFake = fake.returns({
      update: updateFake,
    });
    replace(crypto, "createVerify", createVerifyFake);

    const result = await verify({ key, ring, location, version, project })({
      message,
      signature,
    });

    expect(result).to.equal(isVerified);
    expect(pathFake).to.have.been.calledWith(
      project,
      location,
      ring,
      key,
      version
    );
    expect(createVerifyFake).to.have.been.calledWith("SHA256");
    expect(getKeyFake).to.have.been.calledWith({ name: path });
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(pem, signature, "base64");
  });
  it("shouldn't call the service if the key has already been retrieved", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const isVerified = "some-result";
    const verifyFake = fake.returns(isVerified);
    const updateFake = fake.returns({
      verify: verifyFake,
    });
    const createVerifyFake = fake.returns({
      update: updateFake,
    });
    replace(crypto, "createVerify", createVerifyFake);
    const result = await verify({ key, ring, location, version, project })({
      message,
      signature,
    });

    expect(result).to.equal(isVerified);
    expect(getKeyFake).to.have.not.been.called;
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(pem, signature, "base64");
    expect(pathFake).to.have.not.been.called;
  });

  // it("should sign and verify correctly", async () => {
  //   const message = "I am a message";

  //   const signature = await sign({
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     version: actualVersion,
  //     project: actualProject,
  //   })(message);
  //   const result = await verify({
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     version: actualVersion,
  //     project: actualProject,
  //   })({
  //     message,
  //     signature: signature.toString("base64"),
  //   });
  //   expect(result).to.be.true;
  // });
  // it("should fail if messages dont match", async () => {
  //   const message = "I am a message";
  //   const signature = await sign({
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     version: actualVersion,
  //     project: actualProject,
  //   })(message);
  //   const result = await verify({
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     version: actualVersion,
  //     project: actualProject,
  //   })({
  //     message: `${message}-`,
  //     signature: signature.toString("base64"),
  //   });
  //   expect(result).to.be.false;
  // });
});
