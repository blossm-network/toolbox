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
        //eslint-disable-next-line
        console.log("op: ", operation);
        await viewStore({
          name: state.store.name,
          domain: state.store.domain
        }).update(state.store.root, state.value);
      }
    }

    //eslint-disable-next-line
    console.log("url: ", url);

    const response = await request.post(url, {
      body: {
        root: testing.root,
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        context: testing.context,
        payload: example0.payload
      }
    });

    expect(response.statusCode).to.equal(200);

    const responseRoot = JSON.parse(response.body).root;

    if (testing.root) expect(responseRoot).to.equal(testing.root);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(responseRoot);

    expect(aggregate.headers.root).to.equal(responseRoot);
    for (const property in example0.payload) {
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
        payload: testing.invalid
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
