require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const name = "A-name";

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const config = require("./../../config.json");

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(config.topics.map(t => create(t))));
  after(async () => await Promise.all(config.topics.map(t => del(t))));
  it("should return successfully with no auth", async () => {
    const response = await request.post(`${url}/some-other-action`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          name
        }
      }
    });

    //eslint-disable-next-line
    console.log("body: ", {
      body: response.body
    });

    const root = JSON.parse(response.body).root;

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.name).to.equal(name.toLowerCase());
    expect(response.statusCode).to.equal(200);
  });
  it("should return an error if incorrect params with no auth", async () => {
    const name = 3;
    const response = await request.post(`${url}/some-other-action`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          name
        }
      }
    });
    expect(response.statusCode).to.equal(409);
  });
});
