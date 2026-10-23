import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;
import { restore, fake, replace, match, stub, useFakeTimers } from "sinon";
import deps from "../deps.js";
import connectionToken from "../index.js";
import { create } from "@blossm/jwt";

const token = "some-token";
const root = "some-credentials-root";
const secret = "some-credentials-secret";
const exp = "9999-01-03T00:02:12.000Z";
const expiredExp = "2000-01-03T00:02:12.000Z";
const network = "some-network";
const basicToken = "some-basic-token";

describe("Connection token", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const issueFake = fake.returns({ body: { token: { value: token } } });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);
    const decodeFake = fake.returns({ claims: { exp } });
    replace(deps, "decode", decodeFake);
    const basicTokenFake = fake.returns(basicToken);
    replace(deps, "basicToken", basicTokenFake);
    const credentialsFnFake = fake.returns({ root, secret });
    const writeObjectFake = fake();
    const readObjectFake = stub()
      .onFirstCall()
      .returns(null)
      .onSecondCall()
      .returns({
        token,
        exp,
      });
    const setExpiryFake = fake();
    replace(deps, "redis", {
      writeObject: writeObjectFake,
      readObject: readObjectFake,
      setExpiry: setExpiryFake,
    });
    const result = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network });
    expect(commandFake).to.have.been.calledWith({
      name: "open",
      domain: "connection",
      service: "system",
      network,
    });
    expect(decodeFake).to.have.been.calledWith(token);
    expect(setFake).to.have.been.calledWith({
      token: { externalFn: match((fn) => fn() == basicToken) },
    });
    expect(basicTokenFake).to.have.been.calledWith({
      root,
      secret,
    });
    expect(issueFake).to.have.been.calledWith();
    expect(credentialsFnFake).to.have.been.calledWith({ network });
    expect(result).to.deep.equal({ token, type: "Bearer" });
    const anotherResult = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network });
    expect(readObjectFake).to.have.been.calledWith(`_cToken.${network}`);
    expect(writeObjectFake).to.have.been.calledOnceWith(`_cToken.${network}`, {
      token,
      exp,
    });
    expect(commandFake).to.have.been.calledOnce;
    expect(anotherResult).to.deep.equal({ token, type: "Bearer" });
    const yetAnotherResult = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network });
    expect(commandFake).to.have.been.calledTwice;
    expect(yetAnotherResult).to.deep.equal({ token, type: "Bearer" });
  });
  it("should call correctly if expired", async () => {
    const anotherNetwork = "another-network";
    const issueFake = fake.returns({ body: { token: { value: token } } });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);
    const decodeFake = fake.returns({ claims: { exp } });
    replace(deps, "decode", decodeFake);
    const basicTokenFake = fake.returns(basicToken);
    replace(deps, "basicToken", basicTokenFake);
    const credentialsFnFake = fake.returns({ root, secret });
    const writeObjectFake = fake();
    const readObjectFake = fake.returns({
      token,
      exp: expiredExp,
    });
    const setExpiryFake = fake();
    replace(deps, "redis", {
      writeObject: writeObjectFake,
      readObject: readObjectFake,
      setExpiry: setExpiryFake,
    });
    const result = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network: anotherNetwork });
    expect(result).to.deep.equal({ token, type: "Bearer" });
    expect(commandFake).to.have.been.calledOnce;
  });
  it("should call correctly if no token", async () => {
    const issueFake = fake.returns({ body: {} });
    const setFake = fake.returns({
      issue: issueFake,
    });
    const commandFake = fake.returns({
      set: setFake,
    });
    replace(deps, "command", commandFake);
    const decodeFake = fake.returns({ claims: { exp } });
    replace(deps, "decode", decodeFake);
    const basicTokenFake = fake.returns(basicToken);
    replace(deps, "basicToken", basicTokenFake);
    const credentialsFnFake = fake.returns({ root, secret });
    const writeObjectFake = fake();
    const readObjectFake = fake();
    const setExpiryFake = fake();
    replace(deps, "redis", {
      writeObject: writeObjectFake,
      readObject: readObjectFake,
      setExpiry: setExpiryFake,
    });
    const result = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network: "some-random-network" });
    expect(result).to.be.null;
  });
  it("should call correctly if no credentials", async () => {
    const credentialsFnFake = fake();
    const result = await connectionToken({
      credentialsFn: credentialsFnFake,
    })({ network });
    expect(result).to.have.be.null;
  });
});

describe("Connection token expiration", () => {
  afterEach(restore);
  it("uses actual decoded claims and serializable expiry to refresh the token", async () => {
    const clock = useFakeTimers();
    try {
      let cached;
      const issue = fake(async () => ({
        body: {
          token: {
            value: await create({
              options: {
                issuer: "remote",
                audience: "remote",
                expiresIn: 1000,
              },
              signFn: () => "c2lnbmF0dXJl",
            }),
          },
        },
      }));
      replace(deps, "command", () => ({ set: () => ({ issue }) }));
      replace(deps, "redis", {
        readObject: async () => cached,
        writeObject: async (_, value) => {
          cached = JSON.parse(JSON.stringify(value));
        },
        setExpiry: async () => {},
      });
      const token = connectionToken({
        credentialsFn: async () => ({ root, secret }),
      });
      await token({ network });
      expect(cached.exp).to.equal(new Date(Date.now() + 1000).toISOString());
      await token({ network });
      expect(issue.callCount).to.equal(1);
      clock.tick(1000);
      await token({ network });
      expect(issue.callCount).to.equal(2);
    } finally {
      clock.restore();
    }
  });
  for (const expiry of [undefined, "invalid"]) {
    it(`refreshes cached tokens with ${expiry} expiration`, async () => {
      const issue = fake.returns({ body: {} });
      replace(deps, "command", () => ({ set: () => ({ issue }) }));
      replace(deps, "redis", {
        readObject: async () => ({ token: "stale", exp: expiry }),
        writeObject: fake(),
        setExpiry: fake(),
      });
      const result = await connectionToken({
        credentialsFn: async () => ({ root, secret }),
      })({ network });
      expect(result).to.equal(null);
      expect(issue.callCount).to.equal(1);
    });
  }
});
