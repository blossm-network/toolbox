require("localenv");
const { expect } = require("chai");
const uuid = require("@blossm/uuid");
const {
  subscribe,
  create,
  delete: del,
  unsubscribe
} = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const topic = "some-topic";
const sub = "some-sub";
const version = 0;
const created = "now";
const id = "some-id";
const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const issued = "now";

describe("Event store", () => {
  before(async () => {
    await create(topic);
  });
  after(async () => {
    await del(topic);
  });

  it("should return successfully", async () => {
    const root = uuid();
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
  it("should publish event successfully", done => {
    const root = uuid();

    subscribe({
      topic,
      name: sub,
      fn: (err, subscription) => {
        if (!subscription) throw "Subscription wasn't made";
        subscription.once("message", async event => {
          const eventString = Buffer.from(event.data, "base64")
            .toString()
            .trim();

          const json = JSON.parse(eventString);

          expect(json.payload.code).to.equal("some-code");
          expect(json.payload.phone).to.equal("some-phone");
          expect(json.payload.issued).to.equal("some-date");
          expect(json.payload.principle).to.equal("some-principle");
          await unsubscribe({ topic, name: sub });

          done();
        });

        request.post(url, {
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
      }
    });
  });
});
