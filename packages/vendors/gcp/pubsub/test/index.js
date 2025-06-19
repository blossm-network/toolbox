import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, stub } from "sinon";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

let eventBus;
const topic = "some-topic";
const name = "some-name";
const fn = "some-fn";
const publishFake = fake();
const existsFake = stub();
const createFake = fake();
const deleteFake = fake();
const subscriptionFake = fake.returns({
  create: createFake,
  delete: deleteFake,
  exists: existsFake,
});

describe("Pub sub", () => {
  beforeEach(async () => {
    // Force a fresh import by adding a query parameter
    await import("../index.js?update=" + Date.now());
  });
  afterEach(() => {
    restore();
    deleteFake.resetHistory();
    createFake.resetHistory();
    existsFake.resetHistory();
    publishFake.resetHistory();
    subscriptionFake.resetHistory();
  });
  before(async () => {
    const pubsub = function () {};
    pubsub.prototype.topic = (t) => {
      expect(t).to.equal(topic);
      return {
        subscription: subscriptionFake,
        publishMessage: publishFake,
        create: createFake,
        delete: deleteFake,
        exists: existsFake,
      };
    };
    replace(deps, "PubSub", pubsub);
    eventBus = (await import("../index.js?update=" + Date.now()));
  });
  it("should call publish with the correct params", async () => {
    const data = "some-data";
    await eventBus.publish(data, topic);
    expect(publishFake).to.have.been.calledWith(
      { data: Buffer.from(JSON.stringify(data)) }
    );
  });
  it("should call subscribe with the correct params", async () => {
    existsFake.returns([false]);
    await eventBus.subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
  });
  it("should call subscribe with the correct params if already exists", async () => {
    existsFake.returns([true]);
    await eventBus.subscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith(fn);
  });
  it("should call unsubscribe with the correct params", async () => {
    existsFake.returns([true]);
    await eventBus.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call unsubscribe with the correct params if doesn't exists", async () => {
    existsFake.returns([false]);
    await eventBus.unsubscribe({ topic, name, fn });
    expect(subscriptionFake).to.have.been.calledWith(name);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.not.been.called;
  });
  it("should call create topic with the correct params", async () => {
    existsFake.returns([false]);
    await eventBus.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    existsFake.returns([true]);
    await eventBus.create(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(createFake).to.not.have.been.calledWith();
  });
  it("should call delete topic with the correct params", async () => {
    existsFake.returns([true]);
    await eventBus.del(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.have.been.calledWith();
  });
  it("should call create topic with the correct params if exists", async () => {
    existsFake.returns([false]);
    await eventBus.del(topic);
    expect(existsFake).to.have.been.calledWith();
    expect(deleteFake).to.not.have.been.calledWith();
  });
  it("should correctly tell if a topic exists", async () => {
    const pubsub = function () {};
    const exists = "some-exists";
    const existsFake = fake.returns([exists]);
    pubsub.prototype.topic = (t) => {
      expect(t).to.equal(topic);
      return {
        exists: existsFake,
      };
    };
    replace(deps, "PubSub", pubsub);
    eventBus = (await import("../index.js?update=" + Date.now()));
    const result = await eventBus.exists(topic);
    expect(result).to.equal(exists);
  });
});
