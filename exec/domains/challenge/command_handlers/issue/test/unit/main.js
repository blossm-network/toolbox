const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers, stub } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const root = "some-root";
const principle = "some-person-principle";
const personId = "some-person-id";
const phone = "some-person-phone";
const person = {
  principle,
  phone,
  id: personId
};
const payloadPhone = "some-payload-phone";
const payload = {
  phone: payloadPhone
};
const context = "some-context";
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

    const readFake = fake.returns([person]);
    const updateFake = fake();
    const setFake = stub()
      .onFirstCall()
      .returns({
        read: readFake
      })
      .onSecondCall()
      .returns({
        update: updateFake
      });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const randomIntFake = fake.returns(code);
    replace(deps, "randomIntOfLength", randomIntFake);

    const result = await main({ payload, context });

    expect(result).to.deep.equal({
      root,
      payload: {
        code,
        principle,
        phone,
        issued: new Date().toISOString()
      },
      response: { token }
    });
    expect(readFake).to.have.been.calledWith({ phone: payloadPhone });
    expect(secretFake).to.have.been.calledWith("twilio-account-sid");
    expect(secretFake).to.have.been.calledWith("twilio-auth-token");
    expect(smsFake).to.have.been.calledWith(secret, secret);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledTwice;
    expect(viewStoreFake).to.have.been.calledWith({
      name: "phones",
      domain: "person"
    });
    expect(viewStoreFake).to.have.been.calledWith({
      name: "codes",
      domain: "challenge"
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
        subject: principle,
        audience: `command.challenge.${service}.${network}/answer`,
        expiresIn: 180
      },
      payload: {
        principle,
        context: {
          person: personId,
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
    expect(updateFake).to.have.been.calledWith(root, {
      code,
      expires: deps.stringFromDate(
        deps
          .moment()
          .add(3, "m")
          .toDate()
      )
    });
    expect(smsSendFake).to.have.been.calledWith({
      to: phone,
      from: "+14157700262",
      body: `${code} is your verification code. Enter it in the app to let us know it's really you.`
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const readFake = fake.rejects(new Error(errorMessage));
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    try {
      await main({ payload, context });

      //shouldn't be called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should throw correctly if no phones found", async () => {
    const readFake = fake.returns([]);
    const setFake = fake.returns({
      read: readFake
    });
    const viewStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "viewStore", viewStoreFake);

    try {
      await main({ payload, context });

      //shouldn't be called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
});
