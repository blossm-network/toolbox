const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const secret = require("..");
const deps = require("../deps");

const bucket = "some-bucket";
const name = "some-key-name";
const ring = "some-key-ring";
const location = "some-key-location";
const project = "some-project";
const encrypted = "some-encrpyted-secret";
const theSecret = "some-secret";

process.env.GCP_SECRET_BUCKET = bucket;
process.env.GCP_KMS_SECRET_BUCKET_KEY_RING = ring;
process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION = location;
process.env.GCP_PROJECT = project;

describe("Secrets", () => {
  afterEach(() => {
    restore();
  });
  it("should return the correct secret", async () => {
    const downloadFake = fake();
    const readFileFake = fake.returns(encrypted);
    const decryptFake = fake.returns(theSecret);
    const unlinkFake = fake();
    replace(deps, "download", downloadFake);
    replace(deps, "readFile", readFileFake);
    replace(deps, "decrypt", decryptFake);
    replace(deps, "unlink", unlinkFake);

    const result = await secret(name);
    expect(downloadFake).to.have.been.calledWith({
      bucket,
      file: `${name}.txt.encrypted`
    });
    expect(readFileFake).to.have.been.calledWith(`${name}.txt.encrypted`);
    expect(decryptFake).to.have.been.calledWith({
      message: encrypted,
      key: name,
      ring,
      location,
      project
    });
    expect(unlinkFake).to.have.been.calledOnce;
    expect(result).to.equal(theSecret);
  });
  it("should throw correctly", async () => {
    const error = new Error("some-error");
    const downloadFake = fake.rejects(error);
    replace(deps, "download", downloadFake);
    try {
      await secret(name);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
