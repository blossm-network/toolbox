import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, useFakeTimers } from "sinon";
import verifyAccessToken from "../index.js";

import deps from "../deps.js";
import crypto from "crypto";

chai.use(sinonChai);
const { expect } = chai;

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

    const getFake = fake.returns({ body: JSON.stringify({ key: publicKey }) });
    replace(deps, "get", getFake);

    const verifyFake = fake.returns(result);
    const updateFake = fake.returns({
      verify: verifyFake,
    });

    const createVerifyFake = fake.returns({
      update: updateFake,
    });

    replace(crypto, "createVerify", createVerifyFake);

    const response = await verifyAccessToken({ url, algorithm })({
      message,
      signature,
    });
    expect(response).to.equal(result);
    expect(getFake).to.have.been.calledWith(url);
    expect(createVerifyFake).to.have.been.calledWith(algorithm);
    expect(updateFake).to.have.been.calledWith(message);
    expect(verifyFake).to.have.been.calledWith(publicKey, signature, "base64");
    await verifyAccessToken({ url, algorithm })({
      message,
      signature,
    });
    expect(getFake).to.have.been.calledOnce;
  });
  it("should verify correctly with optionals", async () => {
    const url = "some-url";
    const message = "some-message";
    const signature = "some-signature";
    const publicKey = "some-public-key";
    const result = "some-result";

    const getFake = fake.returns({ body: JSON.stringify({ key: publicKey }) });
    replace(deps, "get", getFake);

    const verifyFake = fake.returns(result);
    const updateFake = fake.returns({
      verify: verifyFake,
    });

    const createVerifyFake = fake.returns({
      update: updateFake,
    });

    replace(crypto, "createVerify", createVerifyFake);

    const response = await verifyAccessToken({ url })({
      message,
      signature,
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

describe("Public key sources and refresh", () => {
  afterEach(restore);
  const message = "offline key rotation";
  const keyPair = () =>
    crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const signed = (key) => ({
    message,
    signature: crypto
      .sign("sha256", Buffer.from(message), key.privateKey)
      .toString("base64"),
  });
  const response = (key) => ({
    body: JSON.stringify({
      key: key.publicKey.export({ type: "spki", format: "pem" }),
    }),
  });
  it("keeps differently configured key sources separate", async () => {
    const a = keyPair();
    const b = keyPair();
    const urlA = `https://a.test/${crypto.randomUUID()}`;
    const urlB = `https://b.test/${crypto.randomUUID()}`;
    const get = fake(async (url) => response(url === urlA ? a : b));
    replace(deps, "get", get);
    const verifyA = verifyAccessToken({ url: urlA });
    const verifyB = verifyAccessToken({ url: urlB });
    expect(await verifyA(signed(a))).to.equal(true);
    expect(await verifyB(signed(a))).to.equal(false);
    expect(await verifyB(signed(b))).to.equal(true);
    expect(get.callCount).to.equal(2);
  });
  it("bounds the shared cache and supports bypassing it", async () => {
    const key = keyPair();
    const get = fake(async () => response(key));
    replace(deps, "get", get);
    const prefix = `https://bounded.test/${crypto.randomUUID()}`;
    for (let index = 0; index < 101; index++) {
      expect(
        await verifyAccessToken({ url: `${prefix}/${index}` })(signed(key))
      ).to.equal(true);
    }
    await verifyAccessToken({ url: `${prefix}/100` })(signed(key));
    expect(get.callCount).to.equal(101);
    await verifyAccessToken({ url: `${prefix}/0` })(signed(key));
    expect(get.callCount).to.equal(102);
    await verifyAccessToken({ url: `${prefix}/0`, cacheMilliseconds: 0 })(
      signed(key)
    );
    expect(get.callCount).to.equal(103);
  });
  it("refreshes an expired cached key without falling back after fetch errors", async () => {
    const clock = useFakeTimers();
    try {
      const a = keyPair();
      const b = keyPair();
      let active = a;
      let unavailable = false;
      const get = fake(async () => {
        if (unavailable) throw new Error("key source unavailable");
        return response(active);
      });
      replace(deps, "get", get);
      const verify = verifyAccessToken({
        url: `https://rotate.test/${crypto.randomUUID()}`,
        cacheMilliseconds: 100,
      });
      expect(await verify(signed(a))).to.equal(true);
      active = b;
      clock.tick(100);
      expect(await verify(signed(a))).to.equal(false);
      expect(await verify(signed(b))).to.equal(true);
      clock.tick(100);
      unavailable = true;
      try {
        await verify(signed(b));
        expect.fail("an expired key must not survive a refresh failure");
      } catch (error) {
        expect(error.message).to.equal("key source unavailable");
      }
    } finally {
      clock.restore();
    }
  });
});
