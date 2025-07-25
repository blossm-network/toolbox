import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

chai.use(sinonChai);
const { expect } = chai;

import deps from "../deps.js";
import kms from "../index.js";

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";
const version = "some-key-version";

const message = "This is my message to sign";
describe("Kms sign", () => {
  afterEach(() => {
    restore();
  });
  it("should sign correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const signature = "some-sig";
    const signFake = fake.returns([{ signature: Buffer.from(signature) }]);
    replace(kms.__client, "cryptoKeyVersionPath", pathFake);
    replace(kms.__client, "asymmetricSign", signFake);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256,
        };
      },
    });
    const crypto = {
      createHash: createHashFake,
    };
    replace(deps, "crypto", crypto);
    const result = await kms.sign({
      ring,
      key,
      location,
      version,
      project,
      message,
    });
    message;
    expect(pathFake).to.have.been.calledWith(
      project,
      location,
      ring,
      key,
      version
    );
    expect(result).to.equal(Buffer.from(signature).toString("base64"));
    expect(signFake).to.have.been.calledWith({
      name: path,
      digest: {
        sha256,
      },
    });
  });
  it("should sign correctly in custom format", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const signature = "some-sig";
    const signFake = fake.returns([{ signature: Buffer.from(signature) }]);
    replace(kms.__client, "cryptoKeyVersionPath", pathFake);
    replace(kms.__client, "asymmetricSign", signFake);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256,
        };
      },
    });
    const crypto = {
      createHash: createHashFake,
    };
    replace(deps, "crypto", crypto);
    const result = await kms.sign({
      ring,
      key,
      location,
      version,
      project,
      message,
      format: "hex",
    });
    message;
    expect(pathFake).to.have.been.calledWith(
      project,
      location,
      ring,
      key,
      version
    );
    expect(result).to.equal(Buffer.from(signature).toString("hex"));
    expect(signFake).to.have.been.calledWith({
      name: path,
      digest: {
        sha256,
      },
    });
  });
  it("should throw correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const errorMessage = "some-error-message";
    const signFake = fake.rejects(new Error(errorMessage));
    replace(kms.__client, "cryptoKeyVersionPath", pathFake);
    replace(kms.__client, "asymmetricSign", signFake);
    const sha256 = "some-sha256-digest";
    const createHashFake = fake.returns({
      update: () => {
        return {
          digest: () => sha256,
        };
      },
    });
    const crypto = {
      createHash: createHashFake,
    };
    replace(deps, "crypto", crypto);
    try {
      await kms.sign({ message, key, ring, location, version, project });

      //shouldn't get called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
