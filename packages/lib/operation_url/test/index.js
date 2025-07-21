import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import operationUrl from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const hash = 12345;
const operation = "some-operation";
const path = "/some-path";
const id = "some-id";
const region = "some-region";
const operationName1 = "some-operation-name";
const operationName2 = "some-operation-name-2";
const operationNameComponents = [operationName1, operationName2];
const computeUrlId = "some-compute-url-id";
const trimmed = "some-trimmed";

describe("Service url", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "some-env";
  });
  afterEach(restore);
  it("should return the correct output", () => {
    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ region, operationNameComponents, computeUrlId, path, id });
    expect(trimFake).to.have.been.calledWith(
      `${operationName2}-${operationName1}`,
      25
    );
    expect(hashFake).to.have.been.calledWith(...operationNameComponents);
    expect(result).to.equal(`https://${region}-${trimmed}-${hash}-${computeUrlId}.${region}.run.app/some-path/some-id`);
  });
  it("should return the correct output in local env", () => {
    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    process.env.NODE_ENV = "local";
    const result = operationUrl({ region, operationNameComponents, computeUrlId, path, id });
    expect(trimFake).to.have.been.calledWith(
      `${operationName2}-${operationName1}`,
      25
    );
    expect(hashFake).to.have.been.calledWith(...operationNameComponents);
    expect(result).to.equal(`http://${region}-${trimmed}-${hash}-${computeUrlId}.${region}.run.app/some-path/some-id`);
  });
  it("should return the correct output with no path", () => {
    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ region, operationNameComponents, computeUrlId, id });
    expect(trimFake).to.have.been.calledWith(
      `${operationName2}-${operationName1}`,
      25
    );
    expect(hashFake).to.have.been.calledWith(...operationNameComponents);
    expect(result).to.equal(`https://${region}-${trimmed}-${hash}-${computeUrlId}.${region}.run.app/some-id`);
  });
  it("should return the correct output with no path or id", () => {
    const trimFake = fake.returns(trimmed);
    replace(deps, "trim", trimFake);

    const hashFake = fake.returns(hash);
    replace(deps, "hash", hashFake);

    const result = operationUrl({ region, operationNameComponents, computeUrlId });
    expect(trimFake).to.have.been.calledWith(
      `${operationName2}-${operationName1}`,
      25
    );
    expect(hashFake).to.have.been.calledWith(...operationNameComponents);
    expect(result).to.equal(`https://${region}-${trimmed}-${hash}-${computeUrlId}.${region}.run.app`);
  });
});
