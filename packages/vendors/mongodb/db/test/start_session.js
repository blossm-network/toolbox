import * as chai from "chai";
import { restore, replace, fake } from "sinon";
import { startSession } from "../index.js";

import deps from "../deps.js";

const { expect } = chai;

describe("Start session", () => {
  afterEach(() => {
    restore();
  });

  it("it should return a session", () => {
    const session = "some-session";
    const startSessionFake = fake.returns(session);
    replace(deps.mongoose, "startSession", startSessionFake);

    const result = startSession();

    expect(result).to.equal(session);
    expect(startSessionFake).to.have.been.calledWith();
  });
});
