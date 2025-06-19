import * as chai from "chai";
import sinonChai from "sinon-chai";
import { stub, restore } from "sinon";

chai.use(sinonChai);
const { expect } = chai;

import { testing } from "../../config.json";

import handlers from "../../handlers.js";

process.env.NETWORK = "local.network";

describe("Projection handlers tests", () => {
  afterEach(() => restore());
  it("should return correctly", async () => {
    for (const handler of testing.handlers) {
      for (const example of handler.examples) {
        let readFactFnFake;
        if (example.readFact) {
          readFactFnFake = stub();
          const actions = example.actions || [example.action];
          let callCount = 0;
          for (let i = 0; i < actions.length; i++) {
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
          expect(result).to.deep.equal(example.result);
        };
        if (example.actions) {
          for (const action of example.actions) await run(action);
        } else {
          await run(example.action);
        }
        if (readFactFnFake) {
          const actions = example.actions || [example.action];
          let callCount = 0;
          for (let i = 0; i < actions.length; i++) {
            for (const call of example.readFact.calls) {
              expect(
                readFactFnFake.getCall(callCount++)
              ).to.have.been.calledWith(call.params);
            }
          }
        }
      }
    }
  });
});
