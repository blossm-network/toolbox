const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const main = require("../src/main");

const secret = "SECRET!";
process.env.secret = secret;

describe("Create auth token", () => {
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

    const issuerInfo = {
      id: "good-id",
      ip: "good-ip"
    };
    const metadata = {
      a: 1,
      b: 2
    };

    const service = "good-service";
    const domain = "good-domain";
    const root = "good-root";
    const scope = "good-command";

    const audience = [
      {
        service,
        domain,
        root,
        scope
      }
    ];

    const issuer = "good-issuer-principle";
    const subject = "good-subject-principle";

    const params = {
      payload: {
        audience,
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
        issuer,
        subject,
        audience: [`${service}:${domain}:${root}:${scope}`],
        expiresIn: 15552000
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
