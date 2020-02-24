const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { get, create } = require("..");
const deps = require("../deps");

const bucket = "some-bucket";
const key = "some-key";
const ring = "some-key-ring";
const location = "some-key-location";
const project = "some-project";
const encrypted = "some-encrpyted-secret";
const secret = "some-secret";
const cipher = "cipher";

process.env.GCP_SECRET_BUCKET = bucket;
process.env.GCP_KMS_SECRET_BUCKET_KEY_RING = ring;
process.env.GCP_KMS_SECRET_BUCKET_KEY_LOCATION = location;
process.env.GCP_PROJECT = project;

describe("Secrets", () => {
  afterEach(() => {
    restore();
  });
  it("should return the correct secret for get", async () => {
    const downloadFake = fake();
    const readFileFake = fake.returns({
      toString: () => {
        return { trim: () => encrypted };
      }
    });
    const decryptFake = fake.returns(secret);
    const unlinkFake = fake();
    replace(deps, "download", downloadFake);
    replace(deps, "readFile", readFileFake);
    replace(deps, "decrypt", decryptFake);
    replace(deps, "unlink", unlinkFake);

    const result = await get(key);
    expect(downloadFake).to.have.been.calledWith({
      bucket,
      file: `${key}.txt.encrypted`
    });
    expect(readFileFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(decryptFake).to.have.been.calledWith({
      message: encrypted,
      key,
      ring,
      location,
      project
    });
    expect(unlinkFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(result).to.equal(secret);
  });
  it("should return the correct secret with passed in options in get", async () => {
    const downloadFake = fake();
    const readFileFake = fake.returns({
      toString: () => {
        return { trim: () => encrypted };
      }
    });
    const decryptFake = fake.returns(secret);
    const unlinkFake = fake();
    replace(deps, "download", downloadFake);
    replace(deps, "readFile", readFileFake);
    replace(deps, "decrypt", decryptFake);
    replace(deps, "unlink", unlinkFake);

    const result = await get(key, {
      project: "some-other-project",
      ring: "some-other-ring",
      location: "some-other-location",
      bucket: "some-other-bucket"
    });
    expect(downloadFake).to.have.been.calledWith({
      bucket: "some-other-bucket",
      file: `${key}.txt.encrypted`
    });
    expect(readFileFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(decryptFake).to.have.been.calledWith({
      message: encrypted,
      key,
      ring: "some-other-ring",
      location: "some-other-location",
      project: "some-other-project"
    });
    expect(unlinkFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(result).to.equal(secret);
  });
  it("should throw correctly with get", async () => {
    const error = new Error("some-error");
    const downloadFake = fake.rejects(error);
    replace(deps, "download", downloadFake);
    try {
      await get(key);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should create the correct secret", async () => {
    const createKeyFake = fake();
    const uploadFake = fake();
    const writeFileFake = fake();
    const encryptFake = fake.returns(cipher);
    const unlinkFake = fake();
    replace(deps, "createKey", createKeyFake);
    replace(deps, "upload", uploadFake);
    replace(deps, "writeFile", writeFileFake);
    replace(deps, "encrypt", encryptFake);
    replace(deps, "unlink", unlinkFake);

    const result = await create(key, secret);
    expect(createKeyFake).to.have.been.calledWith({
      id: key,
      project,
      ring,
      location
    });
    expect(encryptFake).to.have.been.calledWith({
      message: secret,
      key,
      ring,
      location,
      project
    });
    expect(writeFileFake).to.have.been.calledWith(
      `${key}.txt.encrypted`,
      cipher
    );
    expect(uploadFake).to.have.been.calledWith({
      file: `${key}.txt.encrypted`,
      bucket
    });
    expect(unlinkFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(result).to.be.undefined;
  });
  it("should create the correct secret with passed in params", async () => {
    const createKeyFake = fake();
    const uploadFake = fake();
    const writeFileFake = fake();
    const encryptFake = fake.returns(cipher);
    const unlinkFake = fake();
    replace(deps, "createKey", createKeyFake);
    replace(deps, "upload", uploadFake);
    replace(deps, "writeFile", writeFileFake);
    replace(deps, "encrypt", encryptFake);
    replace(deps, "unlink", unlinkFake);

    const result = await create(key, secret, {
      project: "some-other-project",
      ring: "some-other-ring",
      location: "some-other-location",
      bucket: "some-other-bucket"
    });
    expect(createKeyFake).to.have.been.calledWith({
      id: key,
      project: "some-other-project",
      ring: "some-other-ring",
      location: "some-other-location"
    });
    expect(encryptFake).to.have.been.calledWith({
      message: secret,
      key,
      ring: "some-other-ring",
      location: "some-other-location",
      project: "some-other-project"
    });
    expect(writeFileFake).to.have.been.calledWith(
      `${key}.txt.encrypted`,
      cipher
    );
    expect(uploadFake).to.have.been.calledWith({
      file: `${key}.txt.encrypted`,
      bucket: "some-other-bucket"
    });
    expect(unlinkFake).to.have.been.calledWith(`${key}.txt.encrypted`);
    expect(result).to.be.undefined;
  });
  it("should throw correctly with create", async () => {
    const error = new Error("some-error");
    const createKeyFake = fake.rejects(error);
    replace(deps, "createKey", createKeyFake);
    try {
      await create(key, secret);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
