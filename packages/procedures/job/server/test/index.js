import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../deps.js";
import job from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const mainFn = "some-main-fn";

describe("Job", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const returnValue = "some-return-value";
    const listenFake = fake.returns(returnValue);
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const jobPostResult = "some-post-result";
    const jobPostFake = fake.returns(jobPostResult);
    replace(deps, "post", jobPostFake);

    const result = await job({
      mainFn,
    });

    expect(result).to.equal(returnValue);
    expect(listenFake).to.have.been.calledWith();
    expect(serverFake).to.have.been.calledWith();
    expect(postFake).to.have.been.calledWith(jobPostResult);
    expect(jobPostFake).to.have.been.calledWith({ mainFn });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-message");
    const listenFake = fake.rejects(error);
    const postFake = fake.returns({
      listen: listenFake,
    });
    const serverFake = fake.returns({
      post: postFake,
    });
    replace(deps, "server", serverFake);

    const jobPostResult = "some-post-result";
    const jobPostFake = fake.returns(jobPostResult);
    replace(deps, "post", jobPostFake);

    try {
      await job({ mainFn });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
