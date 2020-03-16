const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { download } = require("..");
const deps = require("../deps");

const bucket = "some-bucket";
const file = "some-file";

describe("Download", () => {
  afterEach(() => {
    restore();
  });
  it("should download correctly", async () => {
    const storage = function() {};
    const downloadFake = fake();
    const fileFake = fake.returns({
      download: downloadFake
    });

    const bucketFake = fake.returns({
      file: fileFake
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    await download({ bucket, file });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(fileFake).to.have.been.calledWith(file);
    expect(downloadFake).to.have.been.calledWith({
      destination: file
    });
  });
  it("should download correctly with destination", async () => {
    const storage = function() {};
    const downloadFake = fake();
    const fileFake = fake.returns({
      download: downloadFake
    });

    const bucketFake = fake.returns({
      file: fileFake
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    const destination = "some-destination";
    await download({ bucket, file, destination });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(fileFake).to.have.been.calledWith(file);
    expect(downloadFake).to.have.been.calledWith({
      destination
    });
  });
  it("should throw correctly", async () => {
    const storage = function() {};
    const error = new Error("some-error");
    const downloadFake = fake.rejects(error);
    const fileFake = fake.returns({
      download: downloadFake
    });

    const bucketFake = fake.returns({
      file: fileFake
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    try {
      await download({ bucket, file });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
