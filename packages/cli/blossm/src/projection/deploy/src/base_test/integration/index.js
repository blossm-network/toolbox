require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");

const request = require("@blossm/request");

const { testing, name, context } = require("../../config.json");
const { string: stringDate } = require("@blossm/datetime");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Projection integration tests", () => {
  it("should return successfully", async () => {
    const parallelFns = [];
    const contextRoot = "some-context-root";
    const contextService = "some-context-service";
    const contextNetwork = "some-context-network";

    for (const example of testing.examples) {
      const event = createEvent({
        root: example.root,
        action: example.action.name,
        payload: example.payload,
        domain: example.action.domain,
        service: example.action.service,
        context: {
          [context]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      });

      await eventStore({
        domain: example.action.domain,
        service: example.action.service,
      }).add([{ data: event }]);

      const response = await request.post(url, {
        body: {
          message: {
            data: Buffer.from(
              JSON.stringify({
                saved: stringDate(),
              })
            ),
          },
        },
      });

      expect(response.statusCode).to.equal(204);

      parallelFns.push(async () => {
        const { body: v } = await viewStore({
          name,
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
          .read(example.result.query);

        //TODO
        console.log({ v });
        expect(v.updates).to.exist;

        if (example.result.value) {
          for (const property in example.result.value) {
            //TODO
            console.log({ body: v.content.body, property });
            expect(v.content.body[property]).to.exist;
            if (example.result.value[property] != undefined) {
              expect(v.content.body[property]).to.deep.equal(
                example.result.value[property]
              );
            }
          }
        } else if (example.result.values) {
          expect(example.result.values.length).to.equal(v.content.length);
          for (let i = 0; i < example.result.values.length; i++) {
            let value = example.result.values[i];
            for (const property in value) {
              expect(v.content[i].body[property]).to.exist;
              if (value[property] != undefined) {
                expect(v.content[i].body[property]).to.deep.equal(
                  value[property]
                );
              }
            }
          }
        }
      });
    }

    await Promise.all(parallelFns.map((fn) => fn()));
  });
});
