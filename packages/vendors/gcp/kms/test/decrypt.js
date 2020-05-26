const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { decrypt /*encrypt*/ } = require("..");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";

const message = "This is my message to sign";

// const actualProject = "blossm";
// const actualLocation = "global";
// const actualRing = "test-ring";
// const actualKey = "test-sym-key";

describe("Kms decrypt", () => {
  afterEach(() => {
    restore();
  });
  it("should decrypt correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const decrpytedMessage = "some-decrypted-message";
    const decryptFake = fake.returns([
      { plaintext: Buffer.from(decrpytedMessage) },
    ]);
    kmsClient.prototype.decrypt = decryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await decrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(result).to.equal(decrpytedMessage);
    expect(decryptFake).to.have.been.calledWith({
      name: path,
      ciphertext: Buffer.from(message, "base64"),
    });
  });
  it("should decrypt correctly with new lines removed", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const decrpytedMessage = "some-decrypted-message";
    const decryptFake = fake.returns([
      { plaintext: Buffer.from(`${decrpytedMessage}\n`) },
    ]);
    kmsClient.prototype.decrypt = decryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await decrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(result).to.equal(decrpytedMessage);
    expect(decryptFake).to.have.been.calledWith({
      name: path,
      ciphertext: Buffer.from(message, "base64"),
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const error = new Error("some-error");
    const decryptFake = fake.rejects(error);
    kmsClient.prototype.decrypt = decryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    try {
      await decrypt({ message });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  // it("should encrypt and decrypt correctly", async () => {
  //   const message = "I am a message";

  //   const ciphertext = await encrypt({
  //     message,
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     project: actualProject,
  //   });

  //   const plaintext = await decrypt({
  //     key: actualKey,
  //     ring: actualRing,
  //     location: actualLocation,
  //     project: actualProject,
  //     message: ciphertext,
  //   });

  //   expect(plaintext).to.equal(message);
  // });
});
