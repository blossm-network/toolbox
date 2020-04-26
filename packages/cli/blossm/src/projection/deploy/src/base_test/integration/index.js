require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");

const request = require("@blossm/request");

const {
  testing,
  name,
  domain,
  service,
  context,
} = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Projection integration tests", () => {
  it("should return successfully", async () => {
    const parallelFns = [];
    const contextRoot = "some-context-root";
    const contextService = "some-context-service";
    const contextNetwork = "some-context-network";

    //TODO
    //eslint-disable-next-line no-console
    console.log("1");

    //TODO
    //eslint-disable-next-line no-console
    console.log("2");

    for (const example of testing.examples) {
      //TODO
      //eslint-disable-next-line no-console
      console.log(" example ");
      const event = createEvent({
        root: example.root,
        action: process.env.EVENT_ACTION,
        payload: example.payload,
        domain: process.env.EVENT_DOMAIN,
        service: process.env.EVENT_SERVICE,
        context: {
          [context]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      });

      //TODO
      //eslint-disable-next-line no-console
      console.log({ event });

      await eventStore({
        domain: process.env.EVENT_DOMAIN,
        service: process.env.EVENT_SERVICE,
      }).add([{ data: event }]);

      //TODO
      //eslint-disable-next-line no-console
      console.log("added");

      const response = await request.post(url, {
        body: {
          message: {
            data: Buffer.from(
              JSON.stringify({
                root: example.root,
              })
            ),
          },
        },
      });

      //TODO
      //eslint-disable-next-line no-console
      console.log({ response });

      expect(response.statusCode).to.equal(204);

      parallelFns.push(async () => {
        const { body: v } = await viewStore({
          name,
          ...(domain && { domain }),
          ...(service && { service }),
          context,
        })
          .set({
            context: {
              [context]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            },
          })
          .read(
            example.result.root
              ? { root: example.result.root }
              : example.result.query
          );

        //TODO
        //eslint-disable-next-line no-console
        console.log({ v, zero: v[0] });
        if (example.result.value) {
          for (const property in example.result.value) {
            expect(v[0][property]).to.exist;
            if (example.result.value[property] != undefined) {
              expect(v[0][property]).to.deep.equal(
                example.result.value[property]
              );
            }
          }
        } else if (example.result.values) {
          expect(example.result.values.length).to.equal(v.length);
          for (const value of example.result.values) {
            expect(
              v.some((view) => {
                for (const property in value) {
                  expect(view[property]).to.exist;
                  if (value[property] != undefined) {
                    expect(view[property]).to.deep.equal(value[property]);
                  }
                }
              })
            );
          }
        }
      });
    }
    await Promise.all(parallelFns.map((fn) => fn()));
  });
});
