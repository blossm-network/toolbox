const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const deps = require("../deps");
const createAuthToken = require("..");

const secret = "SECRET!";
process.env.SECRET = secret;

const network = "network!";

const action = "some-action";
const domain = "some-domain";
const service = "some-service";

describe("Create auth token", () => {
  beforeEach(() => {
    process.env.ACTION = action;
    process.env.DOMAIN = domain;
    process.env.SERVICE = service;
    process.env.NETWORK = network;
  });
  afterEach(() => {
    restore();
  });
  it("should execute the request correctly", async () => {
    replace(deps, "cleanCommand", fake());
    replace(deps, "validateCommand", fake());
    const authContext = "some-auth-context";
    replace(deps, "authorizeCommand", fake.returns({ context: authContext }));
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

    const principle = "good-other-principle-root";

    const issuerInfo = {
      id: "good-id",
      ip: "good-ip"
    };

    const audiences = ["one", "two"];

    const context = {
      a: 2
    };

    const goodScope = {
      domain: "some-scope-domain",
      root: "some-scope-root",
      priviledge: "some-scope-priviledge"
    };

    const params = {
      payload: {
        context,
        scopes: [goodScope],
        audiences,
        principle
      },
      issuerInfo,
      issuedTimestamp: 123
    };

    const publishEventFn = fake();
    const signFn = fake();

    const tokens = "tokens";

    const result = await createAuthToken({
      params,
      tokens,
      signFn,
      publishEventFn
    });

    expect(result).to.be.deep.equal({ token: newToken });
    expect(deps.authorizeCommand).to.have.been.calledWith({
      requirements: {
        priviledges: ["create"],
        domain,
        service,
        network
      },
      tokens,
      strict: false
    });
    expect(deps.cleanCommand).to.have.been.calledWith(params);
    expect(deps.validateCommand).to.have.been.calledWith(params);
    expect(deps.normalizeCommand).to.have.been.calledWith(params);
    expect(deps.createEvent).to.have.been.calledWith({
      traceId: params.traceId,
      context: authContext,
      command: {
        id: params.id,
        issuedTimestamp: params.issuedTimestamp,
        action,
        domain,
        network,
        service
      },
      version: 0,
      payload: { issuerInfo, token: newToken }
    });
    expect(publishEventFn).to.have.been.calledWith(event);
  });

  it("should throw correctly", async () => {
    const err = Error();
    replace(deps, "cleanCommand", fake.rejects(err));
    const params = {};

    expect(async () => await createAuthToken({ params })).to.throw;
  });
});
