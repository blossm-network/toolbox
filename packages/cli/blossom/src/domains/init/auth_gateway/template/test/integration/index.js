const { expect } = require("chai");
// const { string: stringDate } = require("@sustainers/datetime");
// const eventStore = require("@sustainers/event-store-js");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    const response = await request.post(`${url}/challenge/issue`, {
      body: {
        phone: "some-test-phone"
      }
    });

    expect(response.statusCode).to.equal(200);
    const token = JSON.parse(response.body).token;

    // const aggregate = await eventStore({
    //   domain: process.env.DOMAIN,
    //   service: process.env.SERVICE,
    //   network: process.env.NETWORK
    // }).aggregate(root);

    expect(token).to.exist;
  });
  // it("should return an error if incorrect params", async () => {
  //   const name = 3;
  //   const response = await request.post(url, {
  //     body: {
  //       headers: {
  //         issued: stringDate()
  //       },
  //       payload: {
  //         name
  //       }
  //     }
  //   });

  //   expect(response.statusCode).to.equal(400);
  // });
});
