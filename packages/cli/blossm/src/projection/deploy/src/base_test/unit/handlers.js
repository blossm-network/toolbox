const { expect } = require("chai").use(require("sinon-chai"));
const { stub, restore } = require("sinon");

const { testing } = require("../../config.json");

const handlers = require("../../handlers.js");

describe("Projection handlers tests", () => {
  afterEach(() => restore());
  it("should return correctly", async () => {
    for (const handler of testing.handlers) {
      for (const example of handler.examples) {
        let readFactFnFake;
        if (example.readFact) {
          readFactFnFake = stub();
          let callCount = 0;
          for (const call of example.readFact.calls) {
            readFactFnFake.onCall(callCount++).returns(call.returns);
          }
        }
        const result = await handlers[handler.event.service][
          handler.event.domain
        ]({
          state: example.state,
          ...(example.id && { root: example.id }),
          ...(example.action && { action: example.action }),
          ...(readFactFnFake && { readFactFn: readFactFnFake }),
        });
        if (readFactFnFake) {
          let callCount = 0;
          for (const call of example.readFact.calls) {
            expect(readFactFnFake.getCall(callCount++)).to.have.been.calledWith(
              call.params
            );
          }
        }
        expect(result).to.deep.equal(example.result);
      }
    }
  });
});
