const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();

const newContextRoot = "some-new-context-root";
const newContextService = "some-new-context-service";
const newContextNetwork = "some-new-context-network";

const payload = {
  context: {
    root: newContextRoot,
    service: newContextService,
    network: newContextNetwork
  }
};
const token = "some-token";
const project = "some-projectl";
const root = "some-root";
const identity = "some-identity";
const contextSession = "some-context-session";
const oldDomain = "some-old-domain";
const context = {
  identity,
  session: contextSession,
  domain: oldDomain,
  [oldDomain]: "some-old-domain"
};
const contextAggregateRoot = "some-context-aggregate-root";
const contextAggregateDomain = "some-context-aggregate-domain";
const contextAggregateService = "some-context-aggregate-service";
const contextAggregateNetwork = "some-context-aggregate-network";

const iss = "some-iss";
const aud = "some-aud";
const sub = "some-sub";
const exp = deps.stringFromDate(new Date(deps.fineTimestamp() + 300));
const session = {
  iss,
  aud,
  sub,
  exp
};

process.env.GCP_PROJECT = project;

describe("Command handler unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: {
          contexts: [
            {
              root: newContextRoot,
              service: newContextService,
              network: newContextNetwork
            }
          ]
        }
      })
      .onSecondCall()
      .returns({ aggregate: { terminated: false } })
      .onThirdCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
          service: contextAggregateService,
          network: contextAggregateNetwork,
          root: contextAggregateRoot
        }
      });

    const result = await main({
      payload,
      root,
      context,
      session,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          action: "switch-context",
          payload,
          root
        }
      ],
      response: { tokens: { session: token } }
    });
    expect(aggregateFake).to.have.been.calledWith(sub, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFake).to.have.been.calledWith(newContextRoot, {
      domain: "context"
    });
    expect(aggregateFake).to.have.callCount(3);
    expect(signFake).to.have.been.calledWith({
      ring: "jwt",
      key: "session",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: iss,
        subject: sub,
        audience: aud,
        expiresIn: Date.parse(exp) - deps.fineTimestamp()
      },
      payload: {
        context: {
          identity,
          session: contextSession,
          context: {
            root: newContextRoot,
            service: newContextService,
            network: newContextNetwork
          },
          domain: contextAggregateDomain,
          [contextAggregateDomain]: {
            root: contextAggregateRoot,
            service: contextAggregateService,
            network: contextAggregateNetwork
          }
        }
      },
      signFn: signature
    });
  });
  it("should throw correctly if context isnt accessible", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const error = "some-error";
    const contextFake = fake.returns(error);
    replace(deps, "unauthorizedError", {
      context: contextFake
    });

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: { contexts: [context] }
      })
      .onSecondCall()
      .returns({ aggregate: { terminated: false } })
      .onThirdCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
          service: contextAggregateService,
          network: contextAggregateNetwork,
          root: contextAggregateRoot
        }
      });

    try {
      await main({
        payload,
        root,
        context,
        session,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if session terminated", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: {
          contexts: [
            {
              root: newContextRoot,
              service: newContextService,
              network: newContextNetwork
            }
          ]
        }
      })
      .onSecondCall()
      .returns({ aggregate: { terminated: true } })
      .onThirdCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
          root: contextAggregateRoot
        }
      });

    const error = "some-error";
    const sessionTerminatedFake = fake.returns(error);
    replace(deps, "badRequestError", {
      sessionTerminated: sessionTerminatedFake
    });

    try {
      await main({
        payload,
        root,
        context,
        session,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const errorMessage = "some-error";
    const createJwtFake = fake.rejects(errorMessage);
    replace(deps, "createJwt", createJwtFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: {
          contexts: [
            {
              root: newContextRoot,
              service: newContextService,
              network: newContextNetwork
            }
          ]
        }
      })
      .onSecondCall()
      .returns({ aggregate: { terminated: false } })
      .onThirdCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
          service: contextAggregateService,
          network: contextAggregateNetwork,
          root: contextAggregateRoot
        }
      });

    try {
      await main({
        payload,
        root,
        context,
        session,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
