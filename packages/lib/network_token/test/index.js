import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fake } from "sinon";

import operationToken from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const network = "some-network";
const token = "some-token";

describe("Service token", () => {
  it("should return the correct output", async () => {
    const tokenFnFake = fake.returns(token);

    const result = await operationToken({
      tokenFn: tokenFnFake,
      network,
    });
    expect(tokenFnFake).to.have.been.calledWith({ network });
    expect(result).to.equal(token);
  });
  it("should return the correct output with no tokenFn", async () => {
    const result = await operationToken({});
    expect(result).to.be.null;
  });
});
