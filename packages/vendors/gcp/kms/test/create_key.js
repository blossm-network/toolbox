import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import kms from "@google-cloud/kms";

chai.use(sinonChai);

const { expect } = chai;

import { createKey } from "../index.js";

const project = "some-gcp-project";
const ring = "some-key-ring";
const id = "some-id";
const location = "some-key-location";

describe("Kms create", () => {
  afterEach(() => {
    restore();
  });
  it("should create correctly", async () => {
    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function () {};
    kmsClient.prototype.keyRingPath = pathFake;
    const createCryptoKeyFake = fake.returns();
    kmsClient.prototype.createCryptoKey = createCryptoKeyFake;
    replace(kms, "KeyManagementServiceClient", kmsClient);
    const result = await createKey({ id, ring, location, project });
    expect(pathFake).to.have.been.calledWith(project, location, ring);
    expect(result).to.be.undefined;
    expect(createCryptoKeyFake).to.have.been.calledWith({
      parent: path,
      cryptoKeyId: id,
      cryptoKey: {
        purpose: "ENCRYPT_DECRYPT",
      },
    });
  });
});
