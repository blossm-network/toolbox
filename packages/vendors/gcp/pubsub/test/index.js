import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import { publish, subscribe, unsubscribe, create, del, exists, __pubsub } from "../index.js";

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
    replace(__pubsub, "topic", topicFake);
    const data = "some-data";
    await publish(data, topic);
    expect(publishFake).to.have.been.calledWith(
      { data: Buffer.from(JSON.stringify(data)) }
    );
  });
  it("should call subscribe with the correct params", async () => {
    const deleteFake = fake();
    const createFake = fake();
    const existsFake = fake.returns([false]);
    const subscriptionFake = fake.returns({
      delete: deleteFake,
      create: createFake,
      exists: existsFake,
    });
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake,
      };
    };
    replace(__pubsub, "topic", topicFake);
    await subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
    expect(deleteFake).to.have.not.been.called;
  });
  it("should call subscribe with the correct params if already exists", async () => {
    const createFake = fake();
    const deleteFake = fake();
    const existsFake = fake.returns([true]);
    const subscriptionFake = fake.returns({
      create: createFake,
      delete: deleteFake,
      exists: existsFake,
    });
    const topicFake = (t) => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake
      };
    };
    replace(__pubsub, "topic", topicFake);
    await subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
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
    replace(__pubsub, "topic", topicFake);
    await unsubscribe({ topic, name, fn });
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
        subscription: subscriptionFake
      };
    };
    replace(__pubsub, "topic", topicFake);
    await unsubscribe({ topic, name, fn });
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
    replace(__pubsub, "topic", topicFake);
    await create(topic);
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
    replace(__pubsub, "topic", topicFake);
    await create(topic);
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
    replace(__pubsub, "topic", topicFake);
    await del(topic);
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
    replace(__pubsub, "topic", topicFake);
    await del(topic);
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
    replace(__pubsub, "topic", topicFake);
    const result = await exists(topic);
    expect(result).to.equal(exist);
  });
});
