const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const main = require("../src/main");

const issuerInfo = {
  id: "good-id",
  ip: "good-ip"
};

const audience0 = "some.audience";
const audience1 = "some-other.audience";
const audiences = [audience0, audience1];

const context = {
  a: 1
};
const authContext = { b: 2 };

const network = "some-network";
const action = "some-action";
const domain = "some-domain";
const service = "some-service";

const principle = "good-subject-principle";

const scopes = [{ k: "some scope" }];

describe("Create auth token", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.NETWORK = network;
    process.env.ACTION = action;
    process.env.SERVICE = service;
    process.env.DOMAIN = domain;
  });
  afterEach(() => {
    restore();
  });
  it("should execute the request correctly", async () => {
    const newUuid = "newUuid!";
    const newUuidFake = fake.returns(newUuid);
    replace(deps, "newUuid", newUuidFake);

    const newToken = "token!";
    const jwtCreateFake = fake.returns(newToken);
    replace(deps, "createJwt", jwtCreateFake);

    const signFn = "some-sign-fn";

    const params = {
      payload: {
        audiences,
        principle,
        context,
        scopes
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const { payload, response } = await main({
      params,
      context: authContext,
      signFn
    });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      payload: {
        root: newUuid,
        principle,
        scopes,
        context: {
          ...context,
          ...authContext,
          network
        }
      },
      signFn
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
  it("should execute the request correctly in staging", async () => {
    const newUuid = "newUuid!";
    const newUuidFake = fake.returns(newUuid);
    replace(deps, "newUuid", newUuidFake);

    const newToken = "token!";
    const jwtCreateFake = fake.returns(newToken);
    replace(deps, "createJwt", jwtCreateFake);

    const params = {
      payload: {
        audiences,
        principle,
        context,
        scopes
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const signFn = "some-sign-fn";

    process.env.NODE_ENV = "staging";

    const { payload, response } = await main({
      params,
      context: authContext,
      signFn
    });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.staging.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      payload: {
        root: newUuid,
        principle,
        context: {
          ...context,
          ...authContext,
          network
        },
        scopes
      },
      signFn
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
  it("should execute the request correctly and override contexts correctly", async () => {
    const newUuid = "newUuid!";
    const newUuidFake = fake.returns(newUuid);
    replace(deps, "newUuid", newUuidFake);

    const newToken = "token!";
    const jwtCreateFake = fake.returns(newToken);
    replace(deps, "createJwt", jwtCreateFake);

    const params = {
      payload: {
        audiences,
        principle,
        context: { a: 1 },
        scopes
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const signFn = "some-sign-fn";

    const { payload, response } = await main({
      params,
      context: { a: 2, network: 4 },
      signFn
    });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      payload: {
        root: newUuid,
        scopes,
        principle,
        context: {
          a: 2,
          network
        }
      },
      signFn
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
});
