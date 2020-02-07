require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");
const { hash } = require("@blossm/crypt");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

const stateTopics = [];

const checkResponse = ({ data, expected }) => {
  for (const property in expected) {
    expect(data[property]).to.exist;
    if (expected[property]) {
      if (
        typeof expected[property] == "object" &&
        !(expected[property] instanceof Array)
      ) {
        checkResponse({
          data: data[property],
          expected: expected[property]
        });
      } else {
        expect(data[property]).to.deep.equal(expected[property]);
      }
    }
  }
};

const formattedPayload = async payload => {
  let result = {};
  for (const property in payload) {
    if (
      typeof payload[property] == "object" &&
      !(payload[property] instanceof Array)
    ) {
      result[property] = await formattedPayload(payload[property]);
    } else if (payload[property].startsWith("#")) {
      result[property] = await hash(
        payload[property].substring(payload[property].indexOf("#") + 1)
      );
    } else {
      result[property] = payload[property];
    }
  }

  return result;
};
const executeStep = async step => {
  if (step.pre) {
    for (const { action, domain, root, payload } of step.pre) {
      const topic = `did-${action}.${domain}.${process.env.SERVICE}`;
      stateTopics.push(topic);
      await create(topic);
      const stateEvent = await createEvent({
        root,
        payload: await formattedPayload(payload),
        action,
        domain,
        service: process.env.SERVICE
      });

      await eventStore({ domain }).add(stateEvent);
    }
  }
  const response = await request.post(url, {
    body: {
      root: step.root,
      headers: {
        //In non-test environments, the command issuer sets the issued date.
        issued: stringDate(),
        //In non-test environments, a gateway adds an id.
        id: uuid()
      },
      options: step.options,
      context: step.context,
      payload: step.payload,
      session: step.session
    }
  });

  expect(response.statusCode).to.equal(step.response ? 200 : step.code || 204);

  if (!step.response) return;

  const parsedBody = JSON.parse(response.body);

  checkResponse({
    expected: step.response,
    data: parsedBody
  });
};

describe("Command handler integration tests", () => {
  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(
    async () =>
      await Promise.all([...testing.topics.map(t => del(t)), ...stateTopics])
  );

  it("should return successfully", async () => {
    for (const step of testing.steps) await executeStep(step);
  });

  it("should return an error if incorrect params", async () => {
    if (!testing.validate.bad || !testing.validate.bad[0]) return;
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        payload: createBadPayload({
          bad: testing.validate.bad[0],
          ok: testing.validate.ok[0]
        })
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});

const createBadPayload = ({ bad, ok }) => {
  let payload = { ...bad };

  for (const property in ok) {
    payload[property] = bad[property]
      ? typeof ok[property] == "object" && !(ok[property] instanceof Array)
        ? createBadPayload({
            bad: bad[property],
            ok: ok[property]
          })
        : (payload[property] = bad[property])
      : (payload[property] = ok[property]);
  }

  return payload;
};
