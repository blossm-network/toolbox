import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake } from "sinon";

import count from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const root = "some-root";
const result = "some-result";

describe("Event store root count", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const countFake = fake.returns(result);

    const req = {
      params: {
        root,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    await count({ countFn: countFake })(req, res);
    expect(countFake).to.have.been.calledWith({
      root,
    });
    expect(sendFake).to.have.been.calledWith({ count: result });
  });
});
