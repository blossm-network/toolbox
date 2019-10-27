const { expect } = require("chai");
const uuid = require("@sustainers/uuid");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Event store integration tests", () => {
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
          name: "some-name"
        }
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${root}`);
    const parsedBody1 = JSON.parse(response1.body);

    expect(response1.statusCode).to.equal(200);
    expect(parsedBody1.state.name).to.equal("some-name");

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
          name: "some-other-name"
        }
      }
    });
    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${root}`);
    const parsedBody3 = JSON.parse(response3.body);

    expect(response3.statusCode).to.equal(200);
    expect(parsedBody3.state.name).to.equal("some-other-name");
  });
  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, { name: 1 });
    expect(response.statusCode).to.be.at.least(400);
  });
});
