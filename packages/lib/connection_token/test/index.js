import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;
import { restore, fake, replace, match, stub } from "sinon";
import deps from "../deps.js";
import connectionToken from "../index.js";

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
    const decodeFake = fake.returns({ exp });
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
      exp: new Date(Date.parse(exp)),
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
    const decodeFake = fake.returns({ exp });
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
    const decodeFake = fake.returns({ exp });
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
