const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { upload } = require("..");
const deps = require("../deps");

const bucket = "some-bucket";
const file = "some-file";

describe("upload", () => {
  afterEach(() => {
    restore();
  });
  it("should upload correctly", async () => {
    const storage = function () {};
    const uploadFake = fake();

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    await upload({ bucket, file });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(uploadFake).to.have.been.calledWith(file, {
      destination: file,
    });
  });
  it("should upload correctly with destination", async () => {
    const storage = function () {};
    const uploadFake = fake();

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    const destination = "some-destination";
    await upload({ bucket, file, destination });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(uploadFake).to.have.been.calledWith(file, {
      destination,
    });
  });
  it("should throw correctly", async () => {
    const storage = function () {};
    const error = new Error("some-error");
    const uploadFake = fake.rejects(error);

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    try {
      await upload({ bucket, file });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
