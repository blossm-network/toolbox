const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");
const uuid = require("@sustainers/uuid");

const request = require("@sustainers/request");

const deps = require("../../deps");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = uuid();

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    const phone = "919-357-1144";
    await deps
      .viewStore({
        name: "phones",
        domain: "person-account",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      //phone should be already formatted in the view store.
      .update(root, { phone: "+19193571144" });

    const response = await request.post(url, {
      body: {
        headers: {
          root,
          issued: stringDate()
        },
        payload: {
          phone
        }
      }
    });

    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).aggregate(root);

    expect(response.statusCode).to.equal(200);
    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.phone).to.equal("+19193571144");

    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person-account",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .delete(root);

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
