import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import operationShortName from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const operation0 = "some-operation0";
const operation1 = "some-operation1";
const operation2 = "some-operation2";
const operationNameComponents = [operation0, operation1, operation2];
const trimmed = "some-trimmed";

describe("Operation short name", () => {
  afterEach(restore);
  it("should return the correct output", async () => {
    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const result = operationShortName(operationNameComponents);
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
    expect(result).to.equal(trimmed);
  });
});
