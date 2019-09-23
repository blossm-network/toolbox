const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const secret = require("..");
const deps = require("../deps");

const name = "some-secret-name";
const bucket = "some-bucket";
process.env.GCP_SECRET_BUCKET = bucket;
const encrypted = "some-encrpyted-secret";
const theSecret = "some-secret";

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
    expect(decryptFake).to.have.been.calledWith(encrypted);
    expect(unlinkFake).to.have.been.calledOnce;
    expect(result).to.equal(theSecret);
  });
  it("should throw correctly", async () => {
    const downloadFake = fake.rejects("some error");
    replace(deps, "download", downloadFake);
    expect(async () => await secret(name)).to.throw;
  });
});
