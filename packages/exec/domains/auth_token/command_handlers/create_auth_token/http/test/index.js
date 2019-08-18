const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const createAuthToken = require("..");

const secret = "SECRET!";
process.env.secret = secret;

describe("Create auth token", () => {
  afterEach(() => {
    restore();
  });
  it("should execute the request correctly", async () => {
    replace(deps, "cleanCommand", fake());
    replace(deps, "validateCommand", fake());
    replace(deps, "normalizeCommand", fake());

    const event = "event!";
    const createEventFake = fake.returns(event);
    replace(deps, "createEvent", createEventFake);

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

    const serviceDomain = "some.service.domain";

    const publishEventFn = fake();

    const result = await createAuthToken({
      body,
      serviceDomain,
      publishEventFn
    });

    expect(result).to.be.deep.equal({ token: newToken });
    expect(deps.cleanCommand).to.have.been.calledWith(body);
    expect(deps.validateCommand).to.have.been.calledWith(body);
    expect(deps.normalizeCommand).to.have.been.calledWith(body);
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
    expect(deps.createEvent).to.have.been.calledWith(body, {
      version: 0,
      topic: "created.auth-token",
      serviceDomain,
      payload: {
        token: newToken,
        issuerInfo,
        account
      }
    });
    expect(publishEventFn).to.have.been.calledWith(event);
  });

  it("should throw correctly", async () => {
    const err = Error();
    replace(deps, "cleanCommand", fake.rejects(err));
    const body = {};

    expect(async () => await createAuthToken({ body })).to.throw;
  });
});
