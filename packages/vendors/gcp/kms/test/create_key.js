const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake } = require("sinon");
const { createKey } = require("..");

const kms = require("@google-cloud/kms");

const project = "some-gcp-project";
const ring = "some-key-ring";
const id = "some-id";
const location = "some-key-location";

describe("Kms create", () => {
  afterEach(() => {
    restore();
  });
  it("should create correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.keyRingPath = pathFake;
    const createCryptoKeyFake = fake.returns();
    kmsClient.prototype.createCryptoKey = createCryptoKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await createKey({ id, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring);
    expect(result).to.be.undefined;
    expect(createCryptoKeyFake).to.have.been.calledWith({
      parent: path,
      cryptoKeyId: id,
      cryptoKey: {
        purpose: "ENCRYPT_DECRYPT",
      },
    });
  });
});
