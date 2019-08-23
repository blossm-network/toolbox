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

    const account = "good-account-root";
    const issuerInfo = {
      id: "good-id",
      ip: "good-ip"
    };
    const metadata = {
      a: 1,
      b: 2
    };

    const permissions = [
      {
        command: "good-command",
        root: "good-root"
      }
    ];
    const body = {
      payload: {
        permissions,
        metadata,
        account
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const { payload, response } = await main(body);

    expect(response).to.be.deep.equal({ token: newToken });
    expect(deps.newUuid).to.have.been.calledOnce;
    expect(deps.createJwt).to.have.been.calledWith({
      data: {
        root: newUuid,
        account,
        issuerInfo,
        permissions,
        metadata
      },
      expiresIn: 15552000,
      secret
    });
    expect(payload).to.deep.equal({
      token: newToken,
      issuerInfo,
      account
    });
  });
});
