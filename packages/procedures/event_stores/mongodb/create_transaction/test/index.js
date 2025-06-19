import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiDatetime from "chai-datetime";
import { restore, replace, fake } from "sinon";

import createTransaction from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
chai.use(chaiDatetime);
const { expect } = chai;

describe("Mongodb event store create transaction", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "not-local";
  });
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const withTransaction = fake.yields();
    const endSessionFake = fake();
    const session = {
      withTransaction,
      endSession: endSessionFake,
    };
    const startSessionFake = fake.returns(session);

    const db = {
      startSession: startSessionFake,
    };
    replace(deps, "db", db);

    const fnResult = "some-fn-result";
    const fnFake = fake.returns(fnResult);
    const result = await createTransaction(fnFake);

    expect(startSessionFake).to.have.been.calledOnce;
    expect(fnFake).to.have.been.calledWith(session);
    expect(endSessionFake).to.have.been.calledOnce;
    expect(result).to.equal(fnResult);
  });
  it("should call with the correct params in local env", async () => {
    const withTransaction = fake.yields();
    const endSessionFake = fake();
    const startSessionFake = fake.returns({
      withTransaction,
      endSession: endSessionFake,
    });

    const db = {
      startSession: startSessionFake,
    };
    replace(deps, "db", db);

    const fnResult = "some-fn-result";
    const fnFake = fake.returns(fnResult);
    process.env.NODE_ENV = "local";
    const result = await createTransaction(fnFake);

    expect(result).to.equal(fnResult);
    expect(fnFake).to.have.been.calledWith();
    expect(endSessionFake).to.not.have.been.called;
    expect(startSessionFake).to.not.have.been.called;
  });
});
