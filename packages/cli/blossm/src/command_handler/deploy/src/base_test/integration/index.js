require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");
const viewStore = require("@blossm/view-store-rpc");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

describe("Command handler integration tests", () => {
  const example0 = testing.examples[0];

  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(async () => await Promise.all(testing.topics.map(t => del(t))));

  it("should have at least one example", async () => {
    expect(example0).to.exist;
  });
  it("should return successfully", async () => {
    if (testing.state) {
      for (const state of testing.state) {
        await viewStore({
          name: state.store.name,
          domain: state.store.domain
        }).update(state.root, state.value);
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
        payload: example0.payload
      }
    });

    expect(response.statusCode).to.equal(200);

    const parsedBody = JSON.parse(response.body);

    for (const value of testing.response || []) {
      expect(parsedBody[value]).to.exist;
    }

    expect(parsedBody.root).to.exist;

    if (testing.root) expect(parsedBody.root).to.equal(testing.root);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    for (const property in testing.event) {
      expect(aggregate.state[property]).to.exist;
      if (testing.event[property])
        expect(aggregate.state[property]).to.deep.equal(
          testing.event[property]
        );
    }
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
