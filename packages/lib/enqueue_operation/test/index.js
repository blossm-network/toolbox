import * as chai from "chai";
import sinonChai from "sinon-chai";
import { expect } from "chai";
import { restore, replace, fake } from "sinon";

chai.use(sinonChai);

import operationEnqueue from "../index.js";

const url = "some-url";
const data = "some-data";
const token = "some-token";
const method = "some-method";

describe("Service token", () => {
  afterEach(restore);
  it("should return the correct output", async () => {

    const enqueueFnFake = fake.returns(token);

    const result = await operationEnqueue({
      url,
      data,
      enqueueFn: enqueueFnFake,
      method,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      url,
      data,
      method,
    });
    expect(result).to.equal(token);
  });
  it("should return the correct output with optionals missing", async () => {
    const enqueueFnFake = fake.returns(token);

    const result = await operationEnqueue({
      url,
      data,
      enqueueFn: enqueueFnFake,
    });
    expect(enqueueFnFake).to.have.been.calledWith({
      url,
      data,
    });
    expect(result).to.equal(token);
  });
});
