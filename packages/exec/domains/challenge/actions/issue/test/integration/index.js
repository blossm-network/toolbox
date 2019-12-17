require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const deps = require("../../deps");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const personRoot = uuid();
const phone = "125-133-32037";

const topic = `did-${process.env.ACTION}.${process.env.DOMAIN}.${process.env.SERVICE}.${process.env.NETWORK}`;

describe("Command handler store integration tests", () => {
  before(async () => await create(topic));
  after(async () => await del(topic));

  it("should return successfully", async () => {
    await deps
      .viewStore({
        name: "phones",
        domain: "person"
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
      domain: process.env.DOMAIN
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.phone).to.equal("+12513332037");

    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person"
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
