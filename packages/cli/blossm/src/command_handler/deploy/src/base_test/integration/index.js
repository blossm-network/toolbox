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

const executeStep = async step => {
  if (step.pre) {
    for (const { action, domain, root, payload } of step.pre) {
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

  //   if (testing.pre && testing.pre.ok) {
  //     for (const { action, domain, root, payload } of testing.pre.ok) {
  //       const topic = `did-${action}.${domain}.${process.env.SERVICE}`;
  //       stateTopics.push(topic);
  //       await create(topic);
  //       const stateEvent = await createEvent({
  //         root,
  //         payload,
  //         action,
  //         domain,
  //         service: process.env.SERVICE
  //       });

  //       await eventStore({ domain }).add(stateEvent);
  //     }
  //   }

  //   const response = await request.post(url, {
  //     body: {
  //       root: testing.root,
  //       headers: {
  //         //In non-test environments, the command issuer sets the issued date.
  //         issued: stringDate(),
  //         //In non-test environments, a gateway adds an id.
  //         id: uuid()
  //       },
  //       options: okExample0.options,
  //       context: okExample0.context,
  //       payload: okExample0.normalized,
  //       session: okExample0.session
  //     }
  //   });

  //   expect(response.statusCode).to.equal(testing.response ? 200 : 204);

  //   if (!testing.response) return;

  //   const parsedBody = JSON.parse(response.body);

  //   for (const value in step.response) {
  //     expect(parsedBody[value]).to.exist;
  //     if (testing.response[value])
  //       expect(parsedBody[value]).to.deep.equal(testing.response[value]);
  //   }
  // });
  // it("should return an error if bad state", async () => {
  //   if (!testing.pre || !testing.pre.bad) return;

  //   for (const {
  //     action,
  //     domain,
  //     root,
  //     payload,
  //     example = 0,
  //     code
  //   } of testing.pre.bad.reverse()) {
  //     const _example = testing.examples.ok[example];
  //     if (!_example) throw `Example ${example} not found.`;
  //     if (action) {
  //       const topic = `did-${action}.${domain}.${process.env.SERVICE}`;
  //       stateTopics.push(topic);
  //       await create(topic);
  //       const stateEvent = await createEvent({
  //         root,
  //         payload,
  //         action,
  //         domain,
  //         service: process.env.SERVICE
  //       });
  //       await eventStore({ domain }).add(stateEvent);
  //     }
  //     const response = await request.post(url, {
  //       body: {
  //         root: testing.root,
  //         headers: {
  //           issued: stringDate(),
  //           id: uuid()
  //         },
  //         payload: _example.normalized,
  //         options: _example.options,
  //         context: _example.context,
  //         session: _example.session
  //       }
  //     });

  //     expect(response.statusCode).to.equal(code);
  //   }
  // });
  // it("should return an error if payload is bad", async () => {
  //   const parallelFns = [];
  //   for (const badExample of testing.validate.bad || []) {
  //     parallelFns.push(async () => {
  //       const response = await request.post(url, {
  //         body: {
  //           headers: {
  //             issued: stringDate(),
  //             id: uuid()
  //           },
  //           payload: badExample.payload
  //         }
  //       });

  //       expect(response.statusCode).to.equal(badExample.code);
  //     });
  //   }

  //   await Promise.all(parallelFns);
  // });
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
