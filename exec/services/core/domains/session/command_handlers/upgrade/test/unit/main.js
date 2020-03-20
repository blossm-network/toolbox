const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();

const principleRoot = "some-principle-root";
const payload = {
  principle: principleRoot
};
const token = "some-token";
const project = "some-projectl";
const root = "some-root";
const context = "some-context";
const service = "some-service";
const network = "some-network";

const iss = "some-iss";
const aud = "some-aud";
const sub = "some-sub";
const exp = deps.stringFromDate(new Date(deps.fineTimestamp() + 300));
const claims = {
  iss,
  aud,
  sub,
  exp
};

process.env.GCP_PROJECT = project;
process.env.SERVICE = service;
process.env.NETWORK = network;

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

    const aggregateFake = fake.returns({
      aggregate: { upgraded: false }
    });

    const result = await main({
      payload,
      root,
      context,
      claims,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          action: "upgrade",
          payload: {
            principle: {
              root: principleRoot,
              service,
              network
            },
            upgraded: deps.stringDate()
          },
          root
        },
        {
          root: principleRoot,
          domain: "principle",
          action: "add-roles",
          payload: { roles: [{ id: "SessionAdmin", service, network }] }
        }
      ],
      response: { tokens: [{ network, type: "access", value: token }] }
    });
    expect(aggregateFake).to.have.been.calledWith(root);
    expect(signFake).to.have.been.calledWith({
      ring: "jwt",
      key: "access",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: iss,
        subject: principleRoot,
        audience: aud,
        expiresIn: Date.parse(exp) - deps.fineTimestamp()
      },
      payload: {
        context: {
          ...context,
          principle: {
            root: principleRoot,
            service,
            network
          }
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

    const aggregateFake = fake.returns({
      aggregate: { terminated: deps.stringDate() }
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
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });

  it("should throw correctly if session has already been upgraded", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const aggregateFake = fake.returns({
      aggregate: { upgraded: true }
    });

    const error = "some-error";
    const sessionAlreadyUpgradedFake = fake.returns(error);
    replace(deps, "badRequestError", {
      sessionAlreadyUpgraded: sessionAlreadyUpgradedFake
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

    const aggregateFake = fake.returns({
      aggregate: { upgraded: false }
    });

    try {
      await main({
        payload,
        root,
        context,
        claims,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
