const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const root = "some-root";
const principle = "some-identity-principle";
const identityRoot = "some-identity-root";
const phone = "some-identity-phone";
const identity = {
  headers: {
    root: identityRoot
  },
  state: {
    principle,
    phone
  }
};
const payloadPhone = "some-payload-phone";
const payload = {
  phone: payloadPhone
};
const context = { a: 1 };
const service = "some-service";
const network = "some-network";
const token = "some-token";
const code = "some-code";
const secret = "some-secret";
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
    const secretFake = fake.returns(secret);
    replace(deps, "secret", secretFake);

    const smsSendFake = fake();
    const smsFake = fake.returns({
      send: smsSendFake
    });
    replace(deps, "sms", smsFake);

    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const queryFake = fake.returns([identity]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const randomIntFake = fake.returns(code);
    replace(deps, "randomIntOfLength", randomIntFake);

    const result = await main({ payload, context });

    expect(result).to.deep.equal({
      events: [
        {
          correctNumber: 0,
          root,
          payload: {
            code,
            principle,
            phone: payloadPhone,
            issued: new Date().toISOString(),
            expires: deps
              .moment()
              .add(180, "s")
              .toDate()
              .toISOString()
          }
        }
      ],
      response: { token }
    });
    expect(queryFake).to.have.been.calledWith({
      key: "phone",
      value: payloadPhone
    });
    expect(secretFake).to.have.been.calledWith("twilio-account-sid");
    expect(secretFake).to.have.been.calledWith("twilio-auth-token");
    expect(smsFake).to.have.been.calledWith(secret, secret);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain: "identity"
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "challenge",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `challenge.${service}.${network}/issue`,
        audience: `challenge.${service}.${network}/answer`,
        expiresIn: 3600
      },
      payload: {
        context: {
          ...context,
          challenge: root,
          service,
          network
        }
      },
      signFn: signature
    });
    expect(randomIntFake).to.have.been.calledWith(6);
    expect(
      Math.abs(
        deps
          .moment()
          .add(3, "m")
          .toDate() - new Date()
      )
    ).to.equal(180000);
    expect(smsSendFake).to.have.been.calledWith({
      to: payloadPhone,
      from: "+14157700262",
      body: `${code} is your verification code. Enter it in the app to let us know it's really you.`
    });
  });
  it("should return successfully if identity is passed in as an option", async () => {
    const secretFake = fake.returns(secret);
    replace(deps, "secret", secretFake);

    const smsSendFake = fake();
    const smsFake = fake.returns({
      send: smsSendFake
    });
    replace(deps, "sms", smsFake);

    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const randomIntFake = fake.returns(code);
    replace(deps, "randomIntOfLength", randomIntFake);

    const optionsPrincipleRoot = "some-options-principle-root";

    const result = await main({
      payload,
      context,
      options: {
        principle: optionsPrincipleRoot
      }
    });

    expect(result).to.deep.equal({
      events: [
        {
          correctNumber: 0,
          root,
          payload: {
            code,
            principle: optionsPrincipleRoot,
            phone: payloadPhone,
            issued: new Date().toISOString(),
            expires: deps
              .moment()
              .add(180, "s")
              .toDate()
              .toISOString()
          }
        }
      ],
      response: { token }
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "challenge",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `challenge.${service}.${network}/issue`,
        audience: `challenge.${service}.${network}/answer`,
        expiresIn: 3600
      },
      payload: {
        context: {
          ...context,
          challenge: root,
          service,
          network
        }
      },
      signFn: signature
    });
    expect(randomIntFake).to.have.been.calledWith(6);
    expect(
      Math.abs(
        deps
          .moment()
          .add(3, "m")
          .toDate() - new Date()
      )
    ).to.equal(180000);
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const queryFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    try {
      await main({ payload, context });

      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should throw correctly if no phones found", async () => {
    const queryFake = fake.returns([]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    try {
      await main({
        payload: {
          ...payload
        },
        context
      });

      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should return successfully with context events", async () => {
    const secretFake = fake.returns(secret);
    replace(deps, "secret", secretFake);

    const smsSendFake = fake();
    const smsFake = fake.returns({
      send: smsSendFake
    });
    replace(deps, "sms", smsFake);

    const uuidFake = fake.returns(root);
    replace(deps, "uuid", uuidFake);

    const queryFake = fake.returns([identity]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const randomIntFake = fake.returns(code);
    replace(deps, "randomIntOfLength", randomIntFake);

    const options = { events: [{ a: 1 }, { b: 2 }] };
    const context = { c: 3 };
    const result = await main({
      payload: {
        ...payload
      },
      context,
      options
    });

    expect(result).to.deep.equal({
      response: {
        token
      },
      events: [
        {
          correctNumber: 0,
          root,
          payload: {
            code,
            phone: payloadPhone,
            principle,
            issued: new Date().toISOString(),
            expires: deps
              .moment()
              .add(180, "s")
              .toDate()
              .toISOString(),
            events: [
              {
                a: 1
              },
              {
                b: 2
              }
            ]
          }
        }
      ]
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `challenge.${service}.${network}/issue`,
        audience: `challenge.${service}.${network}/answer`,
        expiresIn: 3600
      },
      payload: {
        context: {
          c: 3,
          challenge: root,
          service,
          network
        }
      },
      signFn: signature
    });
  });
});
