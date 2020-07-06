const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { encrypt } = require("..");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";

const message = "This is my message to sign";

describe("Kms encrypt", () => {
  afterEach(() => {
    restore();
  });
  it("should encrypt correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(encrpytedMessage);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    kmsClient.prototype.encrypt = encryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await encrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
    expect(result).to.equal(buffer.toString("base64"));
  });
  it("should encrypt correctly with different format", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(encrpytedMessage);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    kmsClient.prototype.encrypt = encryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await encrypt({
      message,
      key,
      ring,
      location,
      project,
      format: "hex",
    });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
    expect(result).to.equal(buffer.toString("hex"));
  });
  it("should encrypt correctly with new lines removed", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(`${encrpytedMessage}\n`);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    kmsClient.prototype.encrypt = encryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await encrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(result).to.equal(buffer.toString("base64"));
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyPath = pathFake;
    const error = new Error("some-error");
    const encryptFake = fake.rejects(error);
    kmsClient.prototype.encrypt = encryptFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    try {
      await encrypt({ message, key, ring, location, project });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
