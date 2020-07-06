const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const crypto = require("crypto");
const { sign } = require("..");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";
const version = "some-key-version";

const message = "This is my message to sign";
describe("Kms sign", () => {
  afterEach(() => {
    restore();
  });
  it("should sign correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const signature = "some-sig";
    const signFake = fake.returns([{ signature: Buffer.from(signature) }]);
    kmsClient.prototype.asymmetricSign = signFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256,
        };
      },
    });
    replace(crypto, "createHash", createHashFake);
    const result = await sign({
      ring,
      key,
      location,
      version,
      project,
      message,
    });
    expect(pathFake).to.have.been.calledWith(
      project,
      location,
      ring,
      key,
      version
    );
    expect(result).to.equal(Buffer.from(signature).toString("base64"));
    expect(signFake).to.have.been.calledWith({
      name: path,
      digest: {
        sha256,
      },
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;

    const errorMessage = "some-error-message";
    const signFake = fake.rejects(new Error(errorMessage));
    kmsClient.prototype.asymmetricSign = signFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256,
        };
      },
    });
    replace(crypto, "createHash", createHashFake);
    try {
      await sign({ message, key, ring, location, version, project });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
