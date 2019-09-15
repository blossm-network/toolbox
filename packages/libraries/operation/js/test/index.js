const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const operation = require("..");
const request = require("@sustainers/request");

let clock;

const now = new Date();

const data = { a: 1, context: 3 };
const context = { b: 4 };
const op = "some.operation";
const token = "some-token";

const network = "some-network";
const service = "some-service";

describe("Operation", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call post with the correct params", async () => {
    const post = fake();
    replace(request, "post", post);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .post({ data, context, tokenFn: tokenFnFake })
      .on({ service, network });

    expect(post).to.have.been.calledWith(
      `https://${op}.${service}.${network}`,
      {
        ...data,
        context
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });

  it("should call get with the correct params", async () => {
    const get = fake();
    replace(request, "get", get);

    const tokenFnFake = fake.returns(token);
    await operation(op)
      .get({ data, context, tokenFn: tokenFnFake })
      .on({ service, network });

    expect(get).to.have.been.calledWith(`https://${op}.${service}.${network}`, {
      ...data,
      context,
      access_token: token
    });
    expect(tokenFnFake).to.have.been.calledWith({
      operation: op
    });
  });
});
