import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

chai.use(sinonChai);
const { expect } = chai;

import kms from "../index.js";

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";

const message = "This is my message to sign";

describe("Kms encrypt", () => {
  afterEach(() => {
    restore();
  });
  it("should encrypt correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(encrpytedMessage);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    replace(kms.__client, "cryptoKeyPath", pathFake);
    replace(kms.__client, "encrypt", encryptFake);
    const result = await kms.encrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
    expect(result).to.equal(buffer.toString("base64"));
  });
  it("should encrypt correctly with different format", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(encrpytedMessage);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    replace(kms.__client, "cryptoKeyPath", pathFake);
    replace(kms.__client, "encrypt", encryptFake);
    const result = await kms.encrypt({
      message,
      key,
      ring,
      location,
      project,
      format: "hex",
    });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
    expect(result).to.equal(buffer.toString("hex"));
  });
  it("should encrypt correctly with new lines removed", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const encrpytedMessage = "some-encrypted-message";
    const buffer = Buffer.from(`${encrpytedMessage}\n`);
    const encryptFake = fake.returns([{ ciphertext: buffer }]);
    replace(kms.__client, "encrypt", encryptFake);
    replace(kms.__client, "cryptoKeyPath", pathFake);
    const result = await kms.encrypt({ message, key, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring, key);
    expect(result).to.equal(buffer.toString("base64"));
    expect(encryptFake).to.have.been.calledWith({
      name: path,
      plaintext: Buffer.from(message),
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const error = new Error("some-error");
    const encryptFake = fake.rejects(error);
    replace(kms.__client, "cryptoKeyPath", pathFake);
    replace(kms.__client, "encrypt", encryptFake);
    try {
      await kms.encrypt({ message, key, ring, location, project });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
