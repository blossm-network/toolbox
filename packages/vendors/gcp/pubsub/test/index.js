const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const gcp = require("@google-cloud/pubsub");

let eventBus;
const topic = "some-topic";
const name = "some-name";
const fn = "some-fn";
const publishFake = fake();

describe("Pub sub", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
  });
  afterEach(() => {
    restore();
  });
  it("should call publish with the correct params", async () => {
    const pubsub = function() {};
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        publish: publishFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    const data = {
      headers: {
        topic
      },
      payload: {
        a: 1
      }
    };
    await eventBus.publish(data);
    expect(publishFake).to.have.been.calledWith(
      Buffer.from(JSON.stringify(data))
    );
  });
  it("should call publish with the correct array params", async () => {
    const pubsub = function() {};
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        publish: publishFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    const data = [
      {
        headers: {
          topic
        },
        payload: {
          a: 1
        }
      }
    ];
    await eventBus.publish(data);
    for (const element of data) {
      expect(publishFake).to.have.been.calledWith(
        Buffer.from(JSON.stringify(element))
      );
    }
  });
  it("should call publish with the correct params and add a payload if missing", async () => {
    const pubsub = function() {};
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        publish: publishFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    const headers = {
      topic
    };
    await eventBus.publish({ headers });
    expect(publishFake).to.have.been.calledWith(
      Buffer.from(JSON.stringify({ headers: { topic }, payload: {} }))
    );
  });
  it("should call subscribe with the correct params", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([false]);
    const createFake = fake();
    const subscriptionFake = fake.returns({
      create: createFake,
      exists: existsFake
    });
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
  });
  it("should call subscribe with the correct params if already exists", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([true]);
    const deleteFake = fake();
    const createFake = fake();
    const subscriptionFake = fake.returns({
      create: createFake,
      delete: deleteFake,
      exists: existsFake
    });
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
  });
  it("should call unsubscribe with the correct params", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([true]);
    const deleteFake = fake();
    const subscriptionFake = fake.returns({
      delete: deleteFake,
      exists: existsFake
    });
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call unsubscribe with the correct params if doesn't exists", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([false]);
    const deleteFake = fake();
    const createFake = fake();
    const subscriptionFake = fake.returns({
      create: createFake,
      delete: deleteFake,
      exists: existsFake
    });
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.not.been.called;
  });
  it("should call create topic with the correct params", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([false]);
    const createFake = fake();
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        create: createFake,
        exists: existsFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([true]);
    const createFake = fake();
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        create: createFake,
        exists: existsFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.not.have.been.calledWith();
  });
  it("should call delete topic with the correct params", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([true]);
    const deleteFake = fake();
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        delete: deleteFake,
        exists: existsFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.delete(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    const pubsub = function() {};
    const existsFake = fake.returns([false]);
    const deleteFake = fake();
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        delete: deleteFake,
        exists: existsFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    await eventBus.delete(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.not.have.been.calledWith();
  });
  it("should correctly tell if a topic exists", async () => {
    const pubsub = function() {};
    const exists = "some-exists";
    const existsFake = fake.returns([exists]);
    pubsub.prototype.topic = t => {
      expect(t).to.equal(topic);
      return {
        exists: existsFake
      };
    };
    replace(gcp, "PubSub", pubsub);
    eventBus = require("..");
    const result = await eventBus.exists(topic);
    expect(result).to.equal(exists);
  });
});
