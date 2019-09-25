const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { decrypt } = require("..");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";

const message = "This is my message to sign";

describe("Kms decrypt", () => {
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
    const result = await decrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
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
