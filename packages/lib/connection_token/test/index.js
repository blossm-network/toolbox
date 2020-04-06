const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const routerConnectionToken = require("..");

const routerNetwork = "some-router-network";
const token = "some-token";
const routerKeyId = "some-router-key-id";
const routerKeySecret = "some-router-key-secret";
const exp = "9999-01-03T00:02:12.000Z";
const expiredExp = "2000-01-03T00:02:12.000Z";
const network = "some-network";
const basicToken = "some-basic-token";
describe("Router connection token", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const response = {
      tokens: [{ network: routerNetwork, value: token }]
    };

    const issueFake = fake.returns(response);
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const validateFake = fake.returns({ exp });
    replace(deps, "validate", validateFake);

    const basicTokenFake = fake.returns(basicToken);
    replace(deps, "basicToken", basicTokenFake);
    const result = await routerConnectionToken({
      routerNetwork,
      routerKeyId,
      routerKeySecret
    })({ network });

    expect(commandFake).to.have.been.calledWith({
      name: "open",
      domain: "connection",
      service: "router",
      network: routerNetwork
    });
    expect(setFake).to.have.been.calledWith({
      tokenFn: basicToken
    });
    expect(basicTokenFake).to.have.been.calledWith({
      id: routerKeyId,
      secret: routerKeySecret
    });
    expect(issueFake).to.have.been.calledWith({ networks: [network] });
    expect(result).to.equal(token);

    const anotherResult = await routerConnectionToken({
      routerNetwork,
      routerKeyId,
      routerKeySecret
    })({ network });
    expect(commandFake).to.have.been.calledOnce;
    expect(anotherResult).to.equal(token);
  });
  it("should call correctly if expired", async () => {
    const response = {
      tokens: [{ network: routerNetwork, value: token }]
    };

    const issueFake = fake.returns(response);
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const validateFake = fake.returns({ exp: expiredExp });
    replace(deps, "validate", validateFake);

    const basicTokenFake = fake.returns(basicToken);
    replace(deps, "basicToken", basicTokenFake);
    const anotherNetwork = "another-network";
    const result = await routerConnectionToken({
      routerNetwork,
      routerKeyId,
      routerKeySecret
    })({ network: anotherNetwork });
    expect(result).to.equal(token);

    const anotherResult = await routerConnectionToken({
      routerNetwork,
      routerKeyId,
      routerKeySecret
    })({ network: anotherNetwork });
    expect(commandFake).to.have.been.calledTwice;
    expect(anotherResult).to.equal(token);
  });
});
