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

const principle = "good-subject-principle";

const scopes = [{ k: "some scope" }];

describe("Create auth token", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.NETWORK = network;
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

    const params = {
      audiences,
      principle,
      context,
      scopes,
      issuerInfo,
      issuedTimestamp: 123
    };

    const { payload, response } = await main({ params, context: authContext });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `create.auth-token.core.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      data: {
        root: newUuid,
        principle,
        scopes,
        context: {
          ...context,
          ...authContext,
          network
        }
      },
      secret: process.env.SECRET
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
      audiences,
      context,
      scopes,
      principle,
      issuerInfo,
      issuedTimestamp: 123
    };

    process.env.NODE_ENV = "staging";

    const { payload, response } = await main({ params, context: authContext });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `create.auth-token.core.staging.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      data: {
        root: newUuid,
        principle,
        context: {
          ...context,
          ...authContext,
          network
        },
        scopes
      },
      secret: process.env.SECRET
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
      audiences,
      principle,
      context: { a: 1 },
      scopes,
      issuerInfo,
      issuedTimestamp: 123
    };

    const { payload, response } = await main({
      params,
      context: { a: 2, network: 4 }
    });

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `create.auth-token.core.${network}`,
        subject: principle,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      data: {
        root: newUuid,
        scopes,
        principle,
        context: {
          a: 2,
          network
        }
      },
      secret: process.env.SECRET
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
});
