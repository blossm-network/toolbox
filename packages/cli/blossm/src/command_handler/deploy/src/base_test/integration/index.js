require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { examples, topics, invalid } = require("./../../config.json");

describe("Command handler integration tests", () => {
  const example0 = examples[0];

  before(async () => await Promise.all(topics.map(t => create(t))));
  after(async () => await Promise.all(topics.map(t => del(t))));

  it("should have at least one example", async () => {
    expect(example0).to.exist;
  });
  it("should return successfully", async () => {
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        payload: example0.payload
      }
    });

    expect(response.statusCode).to.equal(200);

    const root = JSON.parse(response.body).root;

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    for (const property of example0.payload) {
      expect(aggregate.state[property]).to.equal(example0.normalized[property]);
    }
  });
  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        payload: invalid
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
