const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const gcp = require("@google-cloud/pubsub");

let eventBus;
const result = "random";
const topic = "some_topic";
let publish = fake.returns(result);

describe("Event bus", () => {
  before(() => {
    const pubsub = () => {
      return {
        topic: t => {
          expect(t).to.equal(topic);
          return {
            publish
          };
        }
      };
    };

    replace(gcp, "PubSub", pubsub);

    eventBus = require("../index");
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
    expect(publish).to.have.been.calledWith(Buffer.from(JSON.stringify(event)));
    expect(value).to.equal(result);
  });
  it("should call publish with the correct params and add a payload if missing", async () => {
    const fact = {
      topic
    };

    const event = { fact, payload: {} };
    const value = await eventBus.publish({ fact });
    expect(publish).to.have.been.calledWith(Buffer.from(JSON.stringify(event)));
    expect(value).to.equal(result);
  });
});
