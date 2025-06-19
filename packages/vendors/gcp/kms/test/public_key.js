import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import kms from "@google-cloud/kms";
import crypto from "crypto";

chai.use(sinonChai);
const { expect } = chai;

import { publicKey } from "../index.js";

const project = "some-gcp-project";
const ring = "some-key-ring";
const key = "some-key";
const location = "some-key-location";
const version = "some-key-version";
const pem = "some-pem";

describe("Kms verify", () => {
  afterEach(() => {
    restore();
  });
  it("should get the public key correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);

    const isVerified = "some-result";
    const verifyFake = fake.returns(isVerified);
    const updateFake = fake.returns({
      verify: verifyFake,
    });
    const createVerifyFake = fake.returns({
      update: updateFake,
    });
    replace(crypto, "createVerify", createVerifyFake);

    const result = await publicKey({ key, ring, location, version, project });

    expect(result).to.equal(pem);
    expect(pathFake).to.have.been.calledWith(
      project,
      location,
      ring,
      key,
      version
    );
    expect(getKeyFake).to.have.been.calledWith({ name: path });
  });
});
