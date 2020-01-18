require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

const stateTopics = [];

describe("Command handler integration tests", () => {
  const okExample0 = testing.examples.ok[0];

  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(
    async () =>
      await Promise.all([...testing.topics.map(t => del(t)), ...stateTopics])
  );

  it("should have at least one example", async () => {
    expect(okExample0).to.exist;
  });
  it("should return successfully", async () => {
    if (testing.pre && testing.pre.ok) {
      for (const { action, domain, root, payload } of testing.pre.ok) {
        const topic = `did-${action}.${domain}.${process.env.SERVICE}`;
        stateTopics.push(topic);
        await create(topic);
        const stateEvent = await createEvent({
          root,
          payload,
          action,
          domain,
          service: process.env.SERVICE
        });

        await eventStore({ domain }).add(stateEvent);
      }
    }

    const response = await request.post(url, {
      body: {
        root: testing.root,
        headers: {
          //In non-test environments, the command issuer sets the issued date.
          issued: stringDate(),
          //In non-test environments, a gateway adds an id.
          id: uuid()
        },
        context: testing.context,
        payload: okExample0.payload
      }
    });

    expect(response.statusCode).to.equal(testing.response ? 200 : 204);

    if (!testing.response) return;

    const parsedBody = JSON.parse(response.body);

    for (const value in testing.response) {
      expect(parsedBody[value]).to.exist;
      if (testing.response[value])
        expect(parsedBody[value]).to.deep.equal(testing.response[value]);
    }
  });
  it("should return an error if bad state", async () => {
    if (!testing.pre || !testing.pre.bad) return;

    for (const {
      action,
      domain,
      root,
      payload,
      code
    } of testing.pre.bad.reverse()) {
      const topic = `did-${action}.${domain}.${process.env.SERVICE}`;
      stateTopics.push(topic);
      await create(topic);
      const stateEvent = await createEvent({
        root,
        payload,
        action,
        domain,
        service: process.env.SERVICE
      });
      await eventStore({ domain }).add(stateEvent);
      const response = await request.post(url, {
        body: {
          headers: {
            issued: stringDate(),
            id: uuid()
          },
          payload: okExample0.payload
        }
      });

      expect(response.statusCode).to.equal(code);
    }
  });
  it("should return an error if payload is bad", async () => {
    if (!testing.state || !testing.state.bad) return;
    const parallelFns = [];
    for (const badExample of testing.examples.bad || []) {
      parallelFns.push(async () => {
        const response = await request.post(url, {
          body: {
            headers: {
              issued: stringDate(),
              id: uuid()
            },
            payload: badExample.payload
          }
        });

        expect(response.statusCode).to.equal(badExample.code);
      });
    }

    await Promise.all(parallelFns);
  });
  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        payload: testing.invalid
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
