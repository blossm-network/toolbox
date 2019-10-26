const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    const phone = "919-357-1144";
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          phone
        }
      }
    });

    const root = JSON.parse(response.body).root;

    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.phone).to.equal("+19193571144");
    expect(response.statusCode).to.equal(200);
  });
  it("should return an error if incorrect params", async () => {
    const phone = 3;
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          phone
        }
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
