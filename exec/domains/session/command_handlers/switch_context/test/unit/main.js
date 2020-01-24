const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();

const newContext = "some-new-context";
const payload = {
  context: newContext
};
const service = "some-service";
const token = "some-token";
const project = "some-projectl";
const root = "some-root";
const identity = "some-identity";
const contextSession = "some-context-session";
const context = {
  identity,
  session: contextSession
};
const contextAggregateRoot = "some-context-aggregate-root";
const contextAggregateDomain = "some-context-aggregate-domain";

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

process.env.SERVICE = service;
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
      .returns({ aggregate: { terminated: false } })
      .onSecondCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
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
          payload,
          root
        }
      ],
      response: { token }
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(aggregateFake).to.have.been.calledWith(newContext);
    expect(aggregateFake).to.have.been.calledTwice;
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
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
          context: newContext,
          domain: contextAggregateDomain,
          root: contextAggregateRoot
        }
      },
      signFn: signature
    });
  });
  it("should throw correctly if session terminated", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({ aggregate: { terminated: true } })
      .onSecondCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
          root: contextAggregateRoot
        }
      });

    try {
      await main({
        payload,
        root,
        context,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
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
      .returns({ aggregate: { terminated: false } })
      .onSecondCall()
      .returns({
        aggregate: {
          domain: contextAggregateDomain,
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
