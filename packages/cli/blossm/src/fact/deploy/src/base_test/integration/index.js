require("localenv");
const { expect } = require("chai");
// const { create, delete: del, exists } = require("@blossm/gcp-pubsub");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");
const { hash } = require("@blossm/crypt");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

// const stateTopics = [];
const express = require("express");
const mock = {
  app: express(),
  server: null,
  requests: [],
  status: 404,
  responseBody: {},
};
const setupMock = (status, body) => {
  mock.status = status;
  mock.responseBody = body;
};
const initMock = async () => {
  // mock.app.use(bodyParser.urlencoded({ extended: false }));
  // mock.app.use(bodyParser.json());
  // mock.app.use(cors());
  mock.app.get("*", (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log("AHASDFASDF", { query: req.query });
    mock.requests.push(req);
    res.status(mock.status).send(mock.responseBody);
  });

  mock.server = await mock.app.listen(8002);
  //TODO
  //eslint-disable-next-line no-console
  console.log(`Mock server started on port: ${8002}`);
};
const teardownMock = () => {
  if (mock.server) {
    mock.server.close();
    delete mock.server;
  }
};

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
          expected: expected[property],
        });
      } else if (expected[property] instanceof Array) {
        expect(data[property]).to.be.an("array");
        let i = 0;
        for (const expectedValue of expected[property]) {
          checkResponse({
            data: data[property][i],
            expected: expectedValue[i],
          });
          i++;
        }
      } else {
        expect(data[property]).to.deep.equal(expected[property]);
      }
    }
  }
};

const formattedPayload = async (payload) => {
  let result = {};
  for (const property in payload) {
    if (
      typeof payload[property] == "object" &&
      !(payload[property] instanceof Array)
    ) {
      result[property] = await formattedPayload(payload[property]);
    } else if (
      typeof payload[property] == "string" &&
      payload[property].startsWith("#")
    ) {
      result[property] = await hash(
        payload[property].substring(payload[property].indexOf("#") + 1)
      );
    } else {
      result[property] = payload[property];
    }
  }

  return result;
};

const executeStep = async (step) => {
  if (step.pre) {
    for (const { action, domain, service, root, payload } of step.pre) {
      // const topic = `did-${action}.${domain}.${service}`;
      // if (await exists(topic)) existingTopics.push(topic);
      // stateTopics.push(topic);
      // await create(topic);
      const stateEvent = createEvent({
        root,
        payload: await formattedPayload(payload),
        action,
        domain,
        service,
      });

      await eventStore({ domain, service }).add([{ data: stateEvent }]);
    }
  }

  if (step.stub) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ stub: step.stub });
    // for (const { host, method, path, code, response } of step.stub) {
    for (const { code, response } of step.stub) {
      //TODO
      //eslint-disable-next-line no-console
      console.log("MOCKIN");
      //TODO
      //eslint-disable-next-line no-console
      // nock(host)[method](path).reply(code, response);
      setupMock(code, response);
    }
  }

  const response = await request.get(
    `${url}${step.root ? `/${step.root}` : ""}`,
    {
      query: {
        ...(step.context && { context: step.context }),
        ...(step.query && { query: step.query }),
      },
    }
  );

  //TODO
  //eslint-disable-next-line no-console
  console.log({ mockReqs: mock.requests });

  const correctCode = step.response != undefined ? 200 : step.code;
  if (response.statusCode != correctCode) {
    //eslint-disable-next-line no-console
    console.log("response: ", response);
  }

  expect(response.statusCode).to.equal(correctCode);

  if (step.response == undefined) return;

  const parsedBody = JSON.parse(response.body);

  checkResponse({
    expected: step.response,
    data: parsedBody,
  });
};

// const existingTopics = [];
describe("Fact integration tests", () => {
  beforeEach(async () => await initMock());
  beforeEach(() => (mock.requests = []));
  after(() => {
    teardownMock();
  });
  // after(
  //   async () =>
  //     await Promise.all(
  //       [...testing.topics, ...stateTopics].map(
  //         (t) => !existingTopics.includes(t) && del(t)
  //       )
  //     )
  // );

  it("should return successfully", async () => {
    let i = 0;
    for (const step of testing.steps) {
      //eslint-disable-next-line no-console
      console.log("Executing step ", i++);
      await executeStep(step);
    }
  });
});
