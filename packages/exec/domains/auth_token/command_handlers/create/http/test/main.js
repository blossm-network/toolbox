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

const gcpProject = "some-project";
const gcpKeyRing = "some-key-ring";
const gcpKey = "some-key";
const gcpKeyLocation = "some-key-location";
const gcpKeyVersion = "1";

describe("Create auth token", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.NETWORK = network;
    process.env.ACTION = action;
    process.env.SERVICE = service;
    process.env.DOMAIN = domain;
    process.env.GCP_PROJECT = gcpProject;
    process.env.GCP_KEY_RING = gcpKeyRing;
    process.env.GCP_KEY = gcpKey;
    process.env.GCP_KEY_LOCATION = gcpKeyLocation;
    process.env.GCP_KEY_VERSION = gcpKeyVersion;
  });
  afterEach(() => {
    restore();
  });
  it("should execute the request correctly", async () => {
    const newUuid = "newUuid!";
    const newUuidFake = fake.returns(newUuid);
    replace(deps, "newUuid", newUuidFake);

    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;

    const pem = "some-pem";
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;

    replace(deps, "kms", {
      KeyManagementServiceClient: kmsClient
    });

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
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      gcpKeyLocation,
      gcpKeyRing,
      gcpKey,
      gcpKeyVersion
    );
    expect(getKeyFake).to.have.been.calledWith({ name: path });
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.${network}`,
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
      secret: pem
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

    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;

    const pem = "some-pem";
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;

    replace(deps, "kms", {
      KeyManagementServiceClient: kmsClient
    });

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
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      gcpKeyLocation,
      gcpKeyRing,
      gcpKey,
      gcpKeyVersion
    );
    expect(getKeyFake).to.have.been.calledWith({ name: path });
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.staging.${network}`,
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
      secret: pem
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

    const path = "some-path";
    const pathFake = fake.returns(path);
    const kmsClient = function() {};
    kmsClient.prototype.cryptoKeyVersionPath = pathFake;

    const pem = "some-pem";
    const getKeyFake = fake.returns([{ pem }]);
    kmsClient.prototype.getPublicKey = getKeyFake;

    replace(deps, "kms", {
      KeyManagementServiceClient: kmsClient
    });

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
    expect(pathFake).to.have.been.calledWith(
      gcpProject,
      gcpKeyLocation,
      gcpKeyRing,
      gcpKey,
      gcpKeyVersion
    );
    expect(getKeyFake).to.have.been.calledWith({ name: path });
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `${action}.${domain}.${service}.${network}`,
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
      secret: pem
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
});
