const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const main = require("../src/main");

const issuerInfo = {
  id: "good-id",
  ip: "good-ip"
};
const metadata = {
  a: 1,
  b: 2
};

const audience0 = "some.audience";
const audience1 = "some-other.audience";
const audiences = [audience0, audience1];

const issuer = "good-issuer-principle";
const subject = "good-subject-principle";
describe("Create auth token", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
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
      payload: {
        audiences,
        metadata,
        issuer,
        subject
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const { payload, response } = await main(params);

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `create.auth-token.core.${process.env.NETWORK}`,
        subject,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      data: {
        root: newUuid,
        ...metadata
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
      payload: {
        audiences,
        metadata,
        issuer,
        subject
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    process.env.NODE_ENV = "staging";

    const { payload, response } = await main(params);

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      options: {
        issuer: `create.auth-token.core.staging.${process.env.NETWORK}`,
        subject,
        audience: `${audience0},${audience1}`,
        expiresIn: 7776000
      },
      data: {
        root: newUuid,
        ...metadata
      },
      secret: process.env.SECRET
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo
    });
  });
});
