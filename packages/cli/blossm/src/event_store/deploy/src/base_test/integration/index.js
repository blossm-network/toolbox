require("localenv");
const { expect } = require("chai");
const request = require("@blossm/request");
const uuid = require("@blossm/uuid");

const { domain, service, testing, schema } = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const {
  subscribe,
  create,
  delete: del,
  unsubscribe
} = require("@blossm/gcp-pubsub");

const topic = "some-topic";
const sub = "some-sub";
const version = 0;
const created = "now";
const id = "some-id";
const action = "some-action";
const network = "some-network";
const issued = "now";

describe("Event store integration tests", () => {
  const example0 = testing.examples[0];
  const example1 = testing.examples[1];

  before(async () => await create(topic));
  after(async () => await del(topic));

  it("should have examples", () => {
    expect(example0).to.exist;
    expect(example1).to.exist;
  });

  it("should return successfully", async () => {
    const root = uuid();

    const response0 = await request.post(url, {
      body: {
        event: {
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
          payload: example0
        }
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${root}`);
    expect(response1.statusCode).to.equal(200);

    const parsedBody1 = JSON.parse(response1.body);
    for (const property in example0) {
      expect(parsedBody1.state[property]).to.equal(example0[property]);
    }

    const response2 = await request.post(url, {
      body: {
        event: {
          headers: {
            root,
            topic,
            version,
            created,
            action,
            domain,
            command: {
              id,
              action,
              domain,
              service,
              network,
              issued
            }
          },
          payload: example1
        }
      }
    });
    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${root}`);
    expect(response3.statusCode).to.equal(200);

    const parsedBody3 = JSON.parse(response3.body);
    for (const property in example1) {
      expect(parsedBody3.state[property]).to.equal(example1[property]);
    }
  });

  it("should publish event successfully", done => {
    const root = uuid();

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

          for (const property in example0) {
            expect(json.payload[property]).to.equal(example0[property]);
          }

          await unsubscribe({ topic, name: sub });
          done();
        });

        request.post(url, {
          body: {
            event: {
              headers: {
                root,
                topic,
                version,
                created,
                action,
                domain,
                command: {
                  id,
                  action,
                  domain,
                  service,
                  network,
                  issued
                }
              },
              payload: example0
            }
          }
        });
      }
    });
  });
  it("should return an error if incorrect params", async () => {
    const root = uuid();
    //Grab a property from the schema and pass a wrong value to it.
    for (const property in schema) {
      const badValue =
        schema[property] == "String" ||
        (typeof schema[property] == "object" &&
          schema[property]["type"] == "String")
          ? { a: 1 } //pass an object to a String property
          : "some-string"; // or, pass a string to a non-String property

      const response = await request.post(url, {
        body: {
          event: {
            headers: {
              root,
              topic,
              version,
              created,
              action,
              domain,
              command: {
                id,
                action,
                domain,
                service,
                network,
                issued
              }
            },
            payload: { [property]: badValue }
          }
        }
      });
      expect(response.statusCode).to.equal(500);
    }
  });
  it("should return an error if bad number", async () => {
    const root = uuid();

    const response = await request.post(url, {
      body: {
        event: {
          headers: {
            root,
            topic,
            version,
            created,
            action,
            domain,
            command: {
              id,
              action,
              domain,
              service,
              network,
              issued
            }
          },
          payload: example0
        },
        number: 2
      }
    });
    expect(response.statusCode).to.equal(412);
  });
});
