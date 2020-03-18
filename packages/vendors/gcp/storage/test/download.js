const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const { download } = require("..");
const deps = require("../deps");

const bucket = "some-bucket";
const file = "some-file";
const destination = "some-destination.extension";

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
    await download({ bucket, file, destination });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(fileFake).to.have.been.calledWith(file);
    expect(downloadFake).to.have.been.calledWith({ destination });
  });
  it("should download correctly with no file", async () => {
    const storage = function() {};
    const download1Fake = fake();
    const download2Fake = fake();
    const files = [
      {
        download: download1Fake
      },
      {
        download: download2Fake
      }
    ];
    const getFilesFake = fake.returns([files]);

    const bucketFake = fake.returns({
      getFiles: getFilesFake
    });
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    await download({ bucket, destination });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(getFilesFake).to.have.been.calledWith();
    expect(download1Fake).to.have.been.calledWith({
      destination
    });
    expect(download2Fake).to.have.been.calledWith({
      destination: `some-destination_1.extension`
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
