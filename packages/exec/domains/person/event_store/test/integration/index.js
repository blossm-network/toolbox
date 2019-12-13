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
const name = "some-name";
describe("Event store", () => {
  before(async () => {
    await create(topic);
  });
  after(async () => {
    await del(topic);
  });

  it("should return successfully", async () => {
    const root = uuid();

    await subscribe({
      topic,
      name: sub,
      fn: () => {}
    });

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
          name
        }
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${root}`);

    expect(response1.statusCode).to.equal(200);
    expect(JSON.parse(response1.body).state.name).to.equal(name);

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

    expect(response3.statusCode).to.equal(200);
    expect(JSON.parse(response3.body).state.name).to.equal("some-other-name");
    await unsubscribe({ topic, name: sub });
  });
  it("should publish event successfully", async done => {
    const root = uuid();

    await subscribe({
      topic,
      name: sub,
      fn: (err, subscription) => {
        //eslint-disable-next-line
        console.log("err: ", err);
        //eslint-disable-next-line
        console.log("wasssup!: ", subscription);
        if (!subscription) return done();
        subscription.once("message", async event => {
          //eslint-disable-next-line
          console.log("hello: ", { event, data: event.data });
          const eventString = Buffer.from(event.data, "base64")
            .toString()
            .trim();

          //eslint-disable-next-line
          console.log("eventString: ", eventString);
          const json = JSON.parse(eventString);
          //eslint-disable-next-line
          console.log("json: ", json);

          expect(json.payload.name).to.equal(name);

          await unsubscribe({ topic, name: sub });
          await del(topic);

          done();
        });
      }
    });

    //eslint-disable-next-line
    console.log("awaiting");
    await request.post(url, {
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
          name
        }
      }
    });

    await unsubscribe({ topic, name: sub });
  });
});
