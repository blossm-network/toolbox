require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-js");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command handler integration tests", () => {
  it("should return successfully", async () => {
    const name = "A-name";
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          name
        }
      }
    });

    const root = JSON.parse(response.body).root;

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.name).to.equal(name.toLowerCase());
    expect(response.statusCode).to.equal(200);
  });
  it("should return an error if incorrect params", async () => {
    const name = 3;
    const response = await request.post(url, {
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
