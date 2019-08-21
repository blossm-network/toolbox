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

    const response = "some-response";
    const payload = "some-payload";
    const mainFake = fake.returns({ payload, response });
    replace(deps, "main", mainFake);

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

    expect(result).to.be.deep.equal(response);
    expect(deps.cleanCommand).to.have.been.calledWith(body);
    expect(deps.validateCommand).to.have.been.calledWith(body);
    expect(deps.normalizeCommand).to.have.been.calledWith(body);
    expect(deps.createEvent).to.have.been.calledWith(body, {
      version: 0,
      topic: `created.auth-token.${serviceDomain}`,
      serviceDomain,
      payload
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
