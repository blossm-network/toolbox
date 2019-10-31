const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");
const uuid = require("@sustainers/uuid");

const request = require("@sustainers/request");

const deps = require("../../deps");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const personRoot = uuid();

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    const phone = "125-133-32037";
    await deps
      .viewStore({
        name: "phones",
        domain: "person",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });

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

    expect(response.statusCode).to.equal(200);
    const parsedBody = JSON.parse(response.body);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.phone).to.equal("+12513332037");

    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .delete(personRoot);

    expect(deletedCount).to.equal(1);
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
