import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import storage from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const bucket = "some-bucket";
const file = "some-file";

describe("upload", () => {
  afterEach(() => {
    restore();
  });
  it("should upload correctly", async () => {
    const uploadFake = fake();

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    replace(storage.__client, "bucket", bucketFake);
    await storage.upload({ bucket, file });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(uploadFake).to.have.been.calledWith(file, {
      destination: file,
    });
  });
  it("should upload correctly with destination", async () => {
    const uploadFake = fake();

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    replace(storage.__client, "bucket", bucketFake);
    const destination = "some-destination";
    await storage.upload({ bucket, file, destination });
    expect(bucketFake).to.have.been.calledWith(bucket);
    expect(uploadFake).to.have.been.calledWith(file, {
      destination,
    });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-error");
    const uploadFake = fake.rejects(error);

    const bucketFake = fake.returns({
      upload: uploadFake,
    });
    replace(storage.__client, "bucket", bucketFake);
    try {
      await storage.upload({ bucket, file });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
