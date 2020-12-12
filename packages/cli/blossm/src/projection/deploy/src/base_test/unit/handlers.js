const { expect } = require("chai").use(require("sinon-chai"));
const { stub, restore } = require("sinon");

const { testing } = require("../../config.json");

const handlers = require("../../handlers.js");

process.env.NETWORK = "local.network";

describe("Projection handlers tests", () => {
  afterEach(() => restore());
  it("should return correctly", async () => {
    for (const handler of testing.handlers) {
      for (const example of handler.examples) {
        let readFactFnFake;
        if (example.readFact) {
          readFactFnFake = stub();
          if (example.actions) {
            for (let i = 0; i < example.actions.length; i++) {
              let callCount = 0;
              for (const call of example.readFact.calls) {
                readFactFnFake
                  .onCall((i + 1) * callCount++)
                  .returns(call.returns);
              }
            }
          } else {
            let callCount = 0;
            for (const call of example.readFact.calls) {
              readFactFnFake.onCall(callCount++).returns(call.returns);
            }
          }
        }

        const run = async (action) => {
          const result = await handlers[handler.event.service][
            handler.event.domain
          ]({
            state: example.state,
            ...(example.id && { id: example.id }),
            ...(action && { action }),
            ...(example.replayFlag && { replayFlag: example.replayFlag }),
            ...(readFactFnFake && { readFactFn: readFactFnFake }),
          });
          if (readFactFnFake) {
            if (example.actions) {
              for (let i = 0; i < example.actions.length; i++) {
                let callCount = 0;
                for (const call of example.readFact.calls) {
                  expect(
                    readFactFnFake.getCall((i + 1) * callCount++)
                  ).to.have.been.calledWith(call.params);
                }
              }
            } else {
              let callCount = 0;
              for (const call of example.readFact.calls) {
                expect(
                  readFactFnFake.getCall(callCount++)
                ).to.have.been.calledWith(call.params);
              }
            }
          }
          expect(result).to.deep.equal(example.result);
        };
        if (example.actions) {
          for (const action of example.actions) await run(action);
        } else {
          await run(example.action);
        }
      }
    }
  });
});
