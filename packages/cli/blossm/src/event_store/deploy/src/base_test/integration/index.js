require("localenv");
const { expect } = require("chai");
const request = require("@blossm/request");
const { string: dateString } = require("@blossm/datetime");
const uuid = require("@blossm/uuid");

const {
  domain,
  service,
  testing,
  schema,
  indexes,
} = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const {
  subscribe,
  create,
  delete: del,
  unsubscribe,
} = require("@blossm/gcp-pubsub");

const topic = `${process.env.DOMAIN}.${process.env.SERVICE}`;
const sub = "some-sub";
const version = 0;
const created = dateString();

describe("Event store integration tests", () => {
  const example0 = testing.examples.first;
  const example1 = testing.examples.second;

  before(async () => await create(topic));
  after(async () => await del(topic));

  it("should have examples", () => {
    expect(example0).to.exist;
    expect(example1).to.exist;
  });

  it("should return successfully", async () => {
    const root = uuid();

    const countResponse = await request.get(`${url}/count/${root}`);
    const parsedCountBody = JSON.parse(countResponse.body);

    expect(parsedCountBody.count).to.equal(0);

    const response0 = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                action: example0.action,
                domain,
                service,
                version,
                created,
              },
              payload: example0.payload,
            },
          },
        ],
      },
    });

    expect(response0.statusCode).to.equal(204);

    const newCountResponse = await request.get(`${url}/count/${root}`);
    const newParsedCountBody = JSON.parse(newCountResponse.body);

    expect(newParsedCountBody.count).to.equal(1);

    const response1 = await request.get(`${url}/${root}`);
    expect(response1.statusCode).to.equal(200);

    const parsedBody1 = JSON.parse(response1.body);
    for (const property in example0.payload) {
      expect(parsedBody1.state[property]).to.deep.equal(
        example0.payload[property]
      );
    }

    const response2 = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action: example1.action,
                domain,
                service,
              },
              payload: example1.payload,
            },
          },
        ],
      },
    });

    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${root}`);
    expect(response3.statusCode).to.equal(200);

    const parsedBody3 = JSON.parse(response3.body);
    for (const property in example1) {
      expect(parsedBody3.state[property]).to.deep.equal(
        example1.payload[property]
      );
    }

    //Test stream
    let currentNumber = 0;
    await request.stream(
      `${url}/stream/${root}`,
      (data) => {
        const parsedData = JSON.parse(data.toString().trim());
        expect(parsedData.headers.number).to.equal(currentNumber);
        currentNumber++;
      },
      {
        query: {
          from: 0,
        },
      }
    );

    //Test root stream
    await request.stream(
      `${url}/roots`,
      (data) => {
        const parsedData = JSON.parse(data.toString().trim());
        expect(parsedData.root).to.equal(root);
      },
      {
        query: {},
      }
    );

    ///Test indexes
    for (const index of indexes || []) {
      const indexParts = index.split(".");
      const example = [example1, example0].find((e) => {
        let obj = e.payload;
        for (const part of indexParts) {
          obj = obj[part];
          if (obj == undefined) return false;
        }
        return true;
      });
      let value = example.payload;
      for (const part of indexParts) {
        value = value[part];
      }
      const response4 = await request.get(url, {
        query: {
          key: [index],
          value,
        },
      });
      expect(response4.statusCode).to.equal(200);

      const parsedBody4 = JSON.parse(response4.body);
      for (const key in example1.result || example1) {
        expect(parsedBody4[0].state[key]).to.deep.equal(example1.payload[key]);
      }
    }
  });
  it("should return successfully adding two events together", async () => {
    const root = uuid();

    const response = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action: example0.action,
                domain,
                service,
              },
              payload: example0.payload,
            },
          },
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action: example1.action,
                domain,
                service,
              },
              payload: example1.payload,
            },
          },
        ],
      },
    });

    expect(response.statusCode).to.equal(204);
  });

  it("should publish event successfully", (done) => {
    subscribe({
      topic,
      name: sub,
      fn: async (_, subscription) => {
        if (!subscription) throw "Subscription wasn't made";
        const root = uuid();
        subscription.once("message", async (message) => {
          const dataString = Buffer.from(message.data, "base64")
            .toString()
            .trim();
          const data = JSON.parse(dataString);
          expect(data.root).to.equal(root);
          await unsubscribe({ topic, name: sub });
          done();
        });
        request.post(url, {
          body: {
            events: [
              {
                data: {
                  headers: {
                    root,
                    topic,
                    version,
                    created,
                    action: example0.action,
                    domain,
                    service,
                  },
                  payload: example0.payload,
                },
              },
            ],
          },
        });
      },
    });
  });
  const testIncorrectParams = async ({ payload, action }) => {
    const root = uuid();
    const response = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action,
                domain,
                service,
              },
              payload,
            },
          },
        ],
      },
    });
    expect(response.statusCode).to.equal(500);
  };
  it("should not return an error if two simultaneous events are attempted", async () => {
    const root = uuid();

    const [response0, response1] = await Promise.all([
      request.post(url, {
        body: {
          events: [
            {
              data: {
                headers: {
                  root,
                  topic,
                  version,
                  created,
                  action: example0.action,
                  domain,
                  service,
                },
                payload: example0.payload,
              },
            },
          ],
        },
      }),

      request.post(url, {
        body: {
          events: [
            {
              data: {
                headers: {
                  root,
                  topic,
                  version,
                  created,
                  action: example1.action,
                  domain,
                  service,
                },
                payload: example1.payload,
              },
            },
          ],
        },
      }),
    ]);

    expect(response0.statusCode).to.equal(204);
    expect(response1.statusCode).to.equal(204);
  });

  const findBadValue = (schema, property) => {
    return schema[property] == "String" ||
      (typeof schema[property] == "object" &&
        !(schema[property] instanceof Array) &&
        (schema[property]["$type"] == "String" ||
          (typeof schema[property]["$type"] == "object" &&
            schema[property]["$type"]["$type"] == "String")))
      ? { a: 1 } //pass an object to a String property
      : "some-string"; // or, pass a string to a non-String property
  };

  const badObjectValue = async (key, schema) => {
    for (const property in schema) {
      const badValue = findBadValue(schema, property);
      await testIncorrectParams({
        payload: {
          ...example0.payload,
          [key]: { [property]: badValue },
        },
        action: example0.action,
      });
    }
    return "bad-object";
  };

  const badArrayValue = async (property, schema) => {
    const element = schema[0];
    const [exampleToUse] = [
      example0,
      example1,
      ...(testing.examples.more || []),
    ].filter((example) => example.payload[property] != undefined);

    if (!exampleToUse) return "bad-array";

    await testIncorrectParams({
      payload: {
        ...exampleToUse.payload,
        [property]: "not-an-array",
      },
      action: exampleToUse.action,
    });

    if (typeof element == "object") {
      for (const objProperty in element) {
        //root
        const badValue = findBadValue(element, objProperty);
        await testIncorrectParams({
          payload: {
            ...exampleToUse.payload,
            [property]: [{ [objProperty]: badValue }],
          },
          action: exampleToUse.action,
        });
      }
    } else {
      const badValue = element == "String" ? { a: 1 } : "some-string";
      await testIncorrectParams({
        payload: { ...exampleToUse.payload, [property]: [badValue] },
        action: exampleToUse.action,
      });
    }

    return "bad-array";
  };

  it("should return an error if incorrect params", async () => {
    //Grab a property from the schema and pass a wrong value to it.
    for (const property in schema) {
      if (schema[property] == "Object") continue;
      let badValue;
      if (
        typeof schema[property] == "object" &&
        !(schema[property] instanceof Array) &&
        schema[property]["$type"] == undefined
      ) {
        badValue = await badObjectValue(property, schema[property]);
      } else if (schema[property] instanceof Array) {
        badValue = await badArrayValue(property, schema[property]);
      } else {
        badValue = findBadValue(schema, property);
      }

      const [exampleToUse] = [
        example0,
        example1,
        ...(testing.examples.more || []),
      ].filter((example) => example.payload[property] != undefined);

      if (!exampleToUse) return;

      await testIncorrectParams({
        payload: { ...exampleToUse.payload, [property]: badValue },
        action: exampleToUse.action,
      });
    }
  });

  it("should return an error if bad number", async () => {
    const root = uuid();

    const response = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action: testing.action,
                domain,
                service,
              },
              payload: example0,
            },
            number: 2,
          },
        ],
      },
    });
    expect(response.statusCode).to.equal(412);
  });
  it("should return an error if action is not recognized", async () => {
    const root = uuid();

    const response = await request.post(url, {
      body: {
        events: [
          {
            data: {
              headers: {
                root,
                topic,
                version,
                created,
                action: "bogus",
                domain,
                service,
              },
              payload: example0.payload,
            },
          },
        ],
      },
    });

    expect(response.statusCode).to.equal(400);
  });
});
