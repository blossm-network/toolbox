const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const verifyAccessToken = require("..");

const crypto = require("crypto");

const deps = require("../deps");

describe("Verify access token", () => {
  afterEach(() => {
    restore();
  });
  it("should verify correctly", async () => {
    const url = "some-url";
    const message = "some-message";
    const signature = "some-signature";
    const publicKey = "some-public-key";
    const algorithm = "SHA256";
    const result = "some-result";

    const getFake = fake.returns(publicKey);
    replace(deps, "get", getFake);

    const verifyFake = fake.returns(result);
    const updateFake = fake.returns({
      verify: verifyFake
    });

    const createVerifyFake = fake.returns({
      update: updateFake
    });

    replace(crypto, "createVerify", createVerifyFake);

    const response = await verifyAccessToken({ url, algorithm })({
      message,
      signature
    });
    expect(response).to.equal(result);
    expect(getFake).to.have.been.calledWith(url);
    expect(createVerifyFake).to.have.been.calledWith(algorithm);
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(publicKey, signature, "base64");
    await verifyAccessToken({ url, algorithm })({
      message,
      signature
    });
    expect(getFake).to.have.been.calledOnce;
  });
  it("should verify correctly with optionals", async () => {
    const url = "some-url";
    const message = "some-message";
    const signature = "some-signature";
    const publicKey = "some-public-key";
    const result = "some-result";

    const getFake = fake.returns(publicKey);
    replace(deps, "get", getFake);

    const verifyFake = fake.returns(result);
    const updateFake = fake.returns({
      verify: verifyFake
    });

    const createVerifyFake = fake.returns({
      update: updateFake
    });

    replace(crypto, "createVerify", createVerifyFake);

    const response = await verifyAccessToken({ url })({
      message,
      signature
    });
    expect(response).to.equal(result);
    expect(createVerifyFake).to.have.been.calledWith("SHA256");
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(publicKey, signature, "base64");
  });

  // it("should return an empty array if no different elements exist", () => {
  //   const array1 = ["pizza"];
  //   const array2 = ["pizza"];
  //   const array3 = ["pizza"];

  //   const difference = arrayDifference(array1, array2, array3);
  //   expect(difference).to.be.of.length(0);
  // });
});
