require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const nonce = require("@blossm/nonce");
const eventStore = require("@blossm/event-store-rpc");
const {
  subscribe,
  create,
  delete: del,
  unsubscribe
} = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;
const name = "A-name";
const sub = "some-sub";

describe("Command handler integration tests", () => {
  const topic = `did-${process.env.ACTION}.${process.env.DOMAIN}.${process.env.SERVICE}.${process.env.NETWORK}`;
  before(async () => {
    await create(topic);
  });
  after(async () => {
    await del(topic);
  });
  it("should return successfully", async () => {
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: nonce()
        },
        payload: {
          name
        }
      }
    });

    const root = JSON.parse(response.body).root;

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.name).to.equal(name.toLowerCase());
    expect(response.statusCode).to.equal(200);
  });
  it("should publish event successfully", done => {
    subscribe({
      topic,
      name: sub,
      fn: (_, subscription) => {
        if (!subscription) throw "Subscription wasn't made";
        subscription.once("message", async event => {
          const eventString = Buffer.from(event.data, "base64")
            .toString()
            .trim();

          const json = JSON.parse(eventString);

          expect(json.payload.name).to.equal(name.toLowerCase());
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
              name
            }
          }
        });
      }
    });
  });
  it("should return an error if incorrect params", async () => {
    const name = 3;
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: nonce()
        },
        payload: {
          name
        }
      }
    });

    expect(response.statusCode).to.equal(409);
  });
});
