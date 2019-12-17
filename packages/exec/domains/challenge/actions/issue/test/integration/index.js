require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const uuid = require("@blossm/uuid");
const nonce = require("@blossm/nonce");
const {
  subscribe,
  create,
  delete: del,
  unsubscribe
} = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const deps = require("../../deps");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;
const sub = "some-sub";

const personRoot = uuid();
const phone = "125-133-32037";

const topic = `did-${process.env.ACTION}.${process.env.DOMAIN}.${process.env.SERVICE}.${process.env.NETWORK}`;

describe("Command handler store integration tests", () => {
  before(async () => {
    await create(topic);
    await deps
      .viewStore({
        name: "phones",
        domain: "person"
      })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });
  });
  after(async () => {
    await del(topic);
    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person"
      })
      .delete(personRoot);

    expect(deletedCount).to.equal(1);
  });
  it("should return successfully", async () => {
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: nonce()
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
  });
  it("should publish event successfully", done => {
    subscribe({
      topic,
      name: sub,
      fn: async (_, subscription) => {
        if (!subscription) throw "Subscription wasn't made";
        subscription.once("message", async event => {
          const eventString = Buffer.from(event.data, "base64")
            .toString()
            .trim();

          const json = JSON.parse(eventString);

          expect(json.payload.phone).to.equal(phone);
          await unsubscribe({ topic, name: sub });

          done();
        });

        request.post(url, {
          body: {
            headers: {
              issued: stringDate(),
              id: nonce()
            },
            payload: {
              phone
            }
          }
        });
      }
    });
  });
  it("should return an error if incorrect params", async () => {
    const phone = 3;
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: nonce()
        },
        payload: {
          phone
        }
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
