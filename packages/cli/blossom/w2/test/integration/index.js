const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");

const request = require("@sustainers/request");

const url = "http://command-handler:3000";

describe("Command handler store itegration tests", () => {
  it("should return successfully", async () => {
    const name = "Some-name";
    const response = await request.post(url, {
      headers: {
        issued: stringDate()
      },
      payload: {
        name
      }
    });

    const root = JSON.parse(response.body).root;
    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
      .aggregate(root)
      .in({})
      .with();

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.name).to.equal(name.toLowerCase());
    expect(response.statusCode).to.equal(200);
  });
  it("should return an error if incorrect params", async () => {
    const name = 3;
    const response = await request.post(url, {
      headers: {
        issued: stringDate()
      },
      payload: {
        name
      }
    });

    const root = JSON.parse(response.body).root;
    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
      .aggregate(root)
      .in({})
      .with();

    expect(aggregate.statusCode).to.equal(400);
  });
});
