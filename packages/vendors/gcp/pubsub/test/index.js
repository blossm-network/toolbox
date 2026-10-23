import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import pubsub from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const topic = "some-topic";
const name = "some-name";
const fn = "some-fn";

describe("Pub sub", () => {
  afterEach(() => {
    restore();
  });
  it("should call publish with the correct params", async () => {
    const publishFake = fake();
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        publishMessage: publishFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    const data = "some-data";
    await pubsub.publish(data, topic);
    expect(publishFake).to.have.been.calledWith({
      data: Buffer.from(JSON.stringify(data)),
    });
  });
  it("attaches a message handler without replacing an existing subscription", async () => {
    const handler = fake();
    const subscription = {
      exists: fake.resolves([true]),
      delete: fake(),
      create: fake(),
      on: fake(),
    };
    replace(
      pubsub.__pubsub,
      "topic",
      fake.returns({ subscription: fake.returns(subscription) })
    );
    const result = await pubsub.subscribe({ topic, name, fn: handler });
    expect(result).to.equal(subscription);
    expect(subscription.delete).not.to.have.been.called;
    expect(subscription.create).not.to.have.been.called;
    expect(subscription.on).to.have.been.calledWith("message", handler);
  });
  it("awaits creation before registering the message handler", async () => {
    let finish;
    const subscription = {
      exists: fake.resolves([false]),
      create: fake.returns(
        new Promise((resolve) => {
          finish = resolve;
        })
      ),
      on: fake(),
    };
    replace(
      pubsub.__pubsub,
      "topic",
      fake.returns({ subscription: fake.returns(subscription) })
    );
    const handler = fake();
    const pending = pubsub.subscribe({ topic, name, fn: handler });
    await Promise.resolve();
    expect(subscription.on).not.to.have.been.called;
    finish();
    await pending;
    expect(subscription.create).to.have.been.calledWithExactly();
    expect(subscription.on).to.have.been.calledWith("message", handler);
  });
  it("rejects subscription creation failures", async () => {
    const error = new Error("create failed");
    const subscription = {
      exists: fake.resolves([false]),
      create: fake.rejects(error),
      on: fake(),
    };
    replace(
      pubsub.__pubsub,
      "topic",
      fake.returns({ subscription: fake.returns(subscription) })
    );
    try {
      await pubsub.subscribe({ topic, name, fn: fake() });
      expect.fail("creation should reject");
    } catch (result) {
      expect(result).to.equal(error);
    }
    expect(subscription.on).not.to.have.been.called;
  });
  it("should call unsubscribe with the correct params", async () => {
    const deleteFake = fake();
    const existsFake = fake.returns([true]);
    const subscriptionFake = fake.returns({
      delete: deleteFake,
      exists: existsFake,
    });
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call unsubscribe with the correct params if doesn't exists", async () => {
    const deleteFake = fake();
    const existsFake = fake.returns([false]);
    const subscriptionFake = fake.returns({
      delete: deleteFake,
      exists: existsFake,
    });
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.not.been.called;
  });
  it("should call create topic with the correct params", async () => {
    const createFake = fake();
    const existsFake = fake.returns([false]);
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        create: createFake,
        exists: existsFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    const createFake = fake();
    const existsFake = fake.returns([true]);
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        create: createFake,
        exists: existsFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.not.have.been.calledWith();
  });
  it("should call delete topic with the correct params", async () => {
    const deleteFake = fake();
    const existsFake = fake.returns([true]);
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        delete: deleteFake,
        exists: existsFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.del(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    const deleteFake = fake();
    const existsFake = fake.returns([false]);
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        delete: deleteFake,
        exists: existsFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    await pubsub.del(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.not.have.been.calledWith();
  });
  it("should correctly tell if a topic exists", async () => {
    const exist = "some-exists";
    const existsFake = fake.returns([exist]);
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        exists: existsFake,
      };
    };
    replace(pubsub.__pubsub, "topic", topicFake);
    const result = await pubsub.exists(topic);
    expect(result).to.equal(exist);
  });
});
