import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import eventStore from "../index.js";
import deps from "../deps.js";

describe("Event store write outcomes", () => {
  afterEach(restore);

  for (const returnOutcomes of [true, false, undefined]) {
    it(`opts into request and delivery metadata only for ${returnOutcomes}`, async () => {
      const response = {
        statusCode: 200,
        body: { outcomes: ["committed"] },
        delivery: "completed",
      };
      const withFn = fake.resolves(response);
      const postFn = fake.returns({ in: () => ({ with: withFn }) });
      replace(deps, "rpc", fake.returns({ post: postFn }));
      const eventData = [{ event: { headers: {} } }];
      const result = await eventStore({ domain: "test" }).add({
        eventData,
        returnOutcomes,
      });
      expect(postFn.firstCall.args[0]).to.deep.equal({
        eventData,
        ...(returnOutcomes && { returnOutcomes: true }),
      });
      expect(withFn.firstCall.args[0]).to.deep.equal(
        returnOutcomes ? { includeDelivery: true } : {}
      );
      expect(result).to.equal(response);
    });
  }
});
