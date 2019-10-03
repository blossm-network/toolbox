const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");

const request = require("@sustainers/request");

const url = `http://${process.env.CONTAINER_NAME}:${process.env.CONTAINER_PORT}`;

describe("Command handler store", () => {
  it("should return successfully", async () => {
    const response = await request.post(url, {
      headers: {
        issued: stringDate()
      },
      payload: {
        name: "Some-name"
      }
    });
    //eslint-disable-next-line no-console
    console.log("response body: ", {
      body: response.body,
      service: process.env.SERVICE,
      network: process.env.NETWORK,
      domain: process.env.DOMAIN
    });
    const root = JSON.parse(response.body).root;
    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
      .aggregate(root)
      .in({})
      .with(null);

    //eslint-disable-next-line no-console
    console.log("aggregate: ", aggregate);

    expect(aggregate.root).to.equal(root);
    expect(response.statusCode).to.equal(200);
  });
  // it("should return an error if incorrect params", async () => {
  //   const response = await request.post(url, { name: 1 });
  //   expect(response.statusCode).to.be.at.least(400);
  // });
});
