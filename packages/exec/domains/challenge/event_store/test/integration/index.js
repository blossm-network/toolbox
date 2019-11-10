const { expect } = require("chai");
const uuid = require("@blossm/uuid");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

/**
 *
 * TODO:
 *   Write integration tests that verify the schema and indexes you added.
 *   Add tests for POST and GET methods, and make sure to test
 *   error states and edge cases.
 *
 */
describe("Event store", () => {
  it("should return successfully", async () => {
    const root = uuid();
    const topic = "some-topic";
    const version = 0;
    const created = "now";
    const id = "some-id";
    const action = "some-action";
    const domain = "some-domain";
    const service = "some-service";
    const network = "some-network";
    const issued = "now";

    const response0 = await request.post(url, {
      body: {
        headers: {
          root,
          topic,
          version,
          created,
          command: {
            id,
            action,
            domain,
            service,
            network,
            issued
          }
        },
        payload: {
          code: "some-code",
          phone: "some-phone",
          issued: "some-date",
          principle: "some-principle"
        }
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${root}`);

    expect(response1.statusCode).to.equal(200);
    expect(JSON.parse(response1.body).state.code).to.equal("some-code");
    expect(JSON.parse(response1.body).state.phone).to.equal("some-phone");
    expect(JSON.parse(response1.body).state.issued).to.equal("some-date");
    expect(JSON.parse(response1.body).state.principle).to.equal(
      "some-principle"
    );

    const response2 = await request.post(url, {
      body: {
        headers: {
          root,
          topic,
          version,
          created,
          command: {
            id,
            action,
            domain,
            service,
            network,
            issued
          }
        },
        payload: {
          code: "some-other-code"
        }
      }
    });
    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${root}`);

    expect(response3.statusCode).to.equal(200);
    expect(JSON.parse(response3.body).state.code).to.equal("some-other-code");
  });
  // it("should return an error if incorrect params", async () => {
  //   const response = await request.post(url, { name: 1 });
  //   expect(response.statusCode).to.be.at.least(400);
  // });
});
