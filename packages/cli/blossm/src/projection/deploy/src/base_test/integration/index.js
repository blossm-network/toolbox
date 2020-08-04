require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const createEvent = require("@blossm/create-event");

const request = require("@blossm/request");

const { testing, name, context } = require("../../config.json");
const { dateString } = require("@blossm/command-rpc/deps");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

//TODO add integration tests for /replay
describe("Projection integration tests", () => {
  it("should return successfully", async () => {
    let stepCount = 0;
    for (const step of testing.steps) {
      //eslint-disable-next-line no-console
      console.log(`Executing step ${stepCount++}`);

      if (step.pre) {
        for (const { action, domain, service, root, payload } of step.pre) {
          const stateEvent = createEvent({
            root,
            payload,
            action,
            domain,
            service,
            network: process.env.NETWORK,
          });

          await eventStore({ domain, service }).add({
            eventData: [{ event: stateEvent }],
          });
        }
      }

      const now = dateString();
      const event = createEvent({
        root: step.root,
        action: step.event.action,
        payload: step.payload,
        domain: step.event.domain,
        service: step.event.service,
        network: process.env.NETWORK,
        context: {
          [context]: {
            root: step.contextRoot || "some-context-root",
            service: process.env.CONTEXT,
            network: process.env.NETWORK,
          },
        },
      });

      await eventStore({
        domain: step.event.domain,
        service: step.event.service,
      }).add({ eventData: [{ event }] });

      const response = await request.post(url, {
        body: {
          message: {
            data: Buffer.from(
              JSON.stringify({
                root: step.root,
                action: step.event.action,
                domain: step.event.domain,
                service: step.event.service,
                timestamp: now,
              })
            ),
          },
        },
      });

      expect(response.statusCode).to.equal(204);

      const { body: v } = await viewStore({
        name,
        context,
      })
        .set({
          context: {
            [context]: {
              root: step.contextRoot || "some-context-root",
              service: process.env.CONTEXT,
              network: process.env.NETWORK,
            },
          },
        })
        .read(step.result.query || {});

      if (step.result.value) {
        for (const property in step.result.value) {
          expect(v.content[property]).to.exist;
          if (step.result.value[property] != undefined) {
            expect(v.content[property]).to.deep.equal(
              step.result.value[property]
            );
          }
        }
      } else if (step.result.values) {
        expect(step.result.values.length).to.equal(v.content.length);
        for (let i = 0; i < step.result.values.length; i++) {
          let value = step.result.values[i];
          for (const property in value) {
            expect(v.content[i][property]).to.exist;
            if (value[property] != undefined) {
              expect(v.content[i][property]).to.deep.equal(value[property]);
            }
          }
        }
      }
    }
  });
});
