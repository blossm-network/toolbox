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
  it("should throw correctly", async () => {
    const storage = function() {};
    const bucketFake = fake.rejects("some error");
    storage.prototype.bucket = bucketFake;
    replace(deps, "storage", storage);
    expect(async () => await download({ bucket, file })).to.throw;
  });
});
