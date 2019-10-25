const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const sms = require("../");

const deps = require("../deps");

const to = "some-number";
const from = "some-other-number";
const body = "some-body";
const media = "some-media";
const accountSid = "some-account-sid";
const authToken = "some-auth-token";

describe("Twilio sms", () => {
  afterEach(() => {
    restore();
  });
  it("it should execute correctly", async () => {
    const createFake = fake();
    const twilioFake = fake.returns({
      messages: {
        create: createFake
      }
    });
    replace(deps, "twilio", twilioFake);
    const client = await sms(accountSid, authToken);

    expect(twilioFake).to.have.been.calledWith(accountSid, authToken);

    await client.send({ to, from, body, media });

    expect(createFake).to.have.been.calledWith({
      to,
      from,
      body,
      mediaUrl: media
    });
  });
  it("it should execute correctly with optionals omitted", async () => {
    const createFake = fake();
    const twilioFake = fake.returns({
      messages: {
        create: createFake
      }
    });
    replace(deps, "twilio", twilioFake);
    const client = await sms(accountSid, authToken);

    expect(twilioFake).to.have.been.calledWith(accountSid, authToken);

    await client.send({ to, from, body });

    expect(createFake).to.have.been.calledWith({
      to,
      from,
      body
    });
  });
  it("it should throw correctly", async () => {
    const errorMessage = "some-error";
    const createFake = fake.rejects(new Error(errorMessage));
    const twilioFake = fake.returns({
      messages: {
        create: createFake
      }
    });
    replace(deps, "twilio", twilioFake);
    const client = await sms(accountSid, authToken);

    expect(twilioFake).to.have.been.calledWith(accountSid, authToken);

    try {
      await client.send({ to, from, body });
      //shouldnt be called
      expect(1).to.equal(2);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
