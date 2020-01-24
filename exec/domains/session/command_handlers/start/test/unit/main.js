const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const code = "some-code";
const payload = {
  code
};
const service = "some-service";
const network = "some-network";
const token = "some-token";
const project = "some-projectl";

process.env.SERVICE = service;
process.env.NETWORK = network;
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

    const root = "some-root";
    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const result = await main({
      payload
    });

    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            ...payload,
            started: deps.stringDate()
          },
          root,
          correctNumber: 0
        }
      ],
      response: { token }
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `session.${service}.${network}/start`,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          session: root,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should return successfully with context specifying a terminated session", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const root = "some-root";
    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const session = "some-session";
    const aggregateFake = fake.returns({ aggregate: { terminated: true } });
    const result = await main({
      payload,
      context: {
        session
      },
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            ...payload,
            started: deps.stringDate()
          },
          root,
          correctNumber: 0
        }
      ],
      response: { token }
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `session.${service}.${network}/start`,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          session: root,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should return successfully if there is a context", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const root = "some-root";
    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const session = "some-session-root";
    const context = {
      session
    };
    const aggregateFake = fake.returns({ aggregate: { terminated: false } });
    const result = await main({
      payload,
      context,
      aggregateFn: aggregateFake
    });
    expect(aggregateFake).to.have.been.calledWith(session);

    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            ...payload,
            started: deps.stringDate(),
            previous: session
          },
          root,
          correctNumber: 0
        }
      ],
      response: { token }
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `session.${service}.${network}/start`,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          ...context,
          session: root,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should return successfully if there is a context with principle and context", async () => {
    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const root = "some-root";
    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const principle = "some-principle";
    const contextContext = "some-context";
    const session = "some-session-root";
    const context = {
      principle,
      context: contextContext,
      session
    };
    const aggregateFake = fake.returns({ aggregate: { terminated: false } });
    const result = await main({
      payload,
      context,
      aggregateFn: aggregateFake
    });

    expect(aggregateFake).to.have.been.calledWith(session);
    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            ...payload,
            started: deps.stringDate(),
            previous: session,
            upgraded: deps.stringDate(),
            principle,
            context: contextContext
          },
          root,
          correctNumber: 0
        }
      ],
      response: { token }
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `session.${service}.${network}/start`,
        subject: principle,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          ...context,
          session: root,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const uuidFake = fake.rejects(errorMessage);
    replace(deps, "uuid", uuidFake);
    try {
      await main({ payload });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
