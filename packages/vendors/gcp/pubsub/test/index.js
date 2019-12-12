const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const gcp = require("@google-cloud/pubsub");

let eventBus;
const result = "random";
const topicCreateResult = "some-topic-create-result";
const topic = "some-topic";
const name = "some-name";
const fn = "some-fn";
const publishFake = fake.returns(result);
const createFake = fake();
const createTopicFake = fake.returns(topicCreateResult);
const subscriptionFake = fake.returns({
  create: createFake
});

describe("Pub sub", () => {
  before(() => {
    const pubsub = function() {};
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        create: createTopicFake,
        publish: publishFake,
        subscription: subscriptionFake
      };
    };

    replace(gcp, "PubSub", pubsub);

    eventBus = require("..");
  });
  after(() => {
    restore();
  });

  it("should call publish with the correct params", async () => {
    const event = {
      fact: {
        topic
      },
      payload: {
        a: 1
      }
    };

    const value = await eventBus.publish(event);
    expect(publishFake).to.have.been.calledWith(
      Buffer.from(JSON.stringify(event))
    );
    expect(value).to.equal(result);
  });
  it("should call publish with the correct params and add a payload if missing", async () => {
    const fact = {
      topic
    };

    const event = { fact, payload: {} };
    const value = await eventBus.publish({ fact });
    expect(publishFake).to.have.been.calledWith(
      Buffer.from(JSON.stringify(event))
    );
    expect(value).to.equal(result);
  });
  it("should call subscribe with the correct params", async () => {
    await eventBus.subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(createFake).to.have.been.calledWith(fn);
  });
  it("should call create topic with the correct params", async () => {
    const result = await eventBus.create(topic);
    expect(createTopicFake).to.have.been.calledWith();
    expect(result).to.equal(topicCreateResult);
  });
});
