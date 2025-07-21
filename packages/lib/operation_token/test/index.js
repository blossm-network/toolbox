import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import operationToken from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const hash = 12345;
const operation0 = "some-operation0";
const operation1 = "some-operation1";
const operation2 = "some-operation2";
const operationNameComponents = [operation0, operation1, operation2];
const trimmed = "some-trimmed";
const token = "some-token";

describe("Service token", () => {
  afterEach(restore);
  it("should return the correct output", async () => {
    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const tokenFnFake = fake.returns(token);

    const result = await operationToken({
      tokenFn: tokenFnFake,
      operationNameComponents,
    });
    expect(hashFake).to.have.been.calledWith(...operationNameComponents);
    expect(trimFake).to.have.been.calledWith(
      "some-operation2-some-operation1-some-operation0",
      25
    );
    //doesn't mutate the origianl operation.
    expect(operationNameComponents).to.deep.equal([
      "some-operation0",
      "some-operation1",
      "some-operation2",
    ]);
    expect(tokenFnFake).to.have.been.calledWith({ hash, name: trimmed });
    expect(result).to.equal(token);
  });
  it("should return the correct output with no tokenFn", async () => {
    const result = await operationToken({});
    expect(result).to.be.null;
  });
});
