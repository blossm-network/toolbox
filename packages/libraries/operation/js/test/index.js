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

const network = "some-network";
const service = "some-service";

describe("Operation", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
    process.env.NETWORK = network;
    process.env.SERVICE = service;
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call post with the correct params", async () => {
    const post = fake();
    replace(request, "post", post);

    await operation(op).post({ data, context });

    expect(post).to.have.been.calledWith(
      `https://${op}.${service}.${network}`,
      {
        ...data,
        context
      }
    );
  });

  it("should call get with the correct params", async () => {
    const get = fake();
    replace(request, "get", get);

    await operation(op).get({ data, context });

    expect(get).to.have.been.calledWith(`https://${op}.${service}.${network}`, {
      ...data,
      context
    });
  });

  // it("should call with the correct params in staging", async () => {
  //   const post = fake();
  //   replace(request, "post", post);

  //   process.env.NODE_ENV = "staging";

  //   const action = "some-action!";
  //   const domain = "some-domain!";
  //   const service = "some-service!";

  //   const payload = { a: 1 };

  //   await issueCommand({ action, domain, service }).with(payload);

  //   expect(post).to.have.been.calledWith(
  //     `${protocol}${action}.${domain}.${service}.staging.sustainer.network`,
  //     {
  //       payload,
  //       issuedTimestamp: datetime.fineTimestamp()
  //     }
  //   );
  // });

  // it("should call with the correct params with req", async () => {
  //   const post = fake();
  //   replace(request, "post", post);

  //   const sourceCommand = {
  //     id: "some-id!",
  //     action: "some-action!",
  //     domain: "some-domain!",
  //     service: "some-service!"
  //   };

  //   const payload = { a: 1 };

  //   const traceId = "traceId!";
  //   const issuerInfo = {
  //     a: 1,
  //     b: 2
  //   };

  //   const params = {
  //     traceId,
  //     sourceCommand,
  //     issuerInfo
  //   };

  //   const action = "an-action";
  //   const domain = "a-domain";
  //   const service = "a-service";

  //   await issueCommand({ action, domain, service }).with(payload, { params });

  //   expect(post).to.have.been.calledWith(
  //     `${protocol}${action}.${domain}.${service}.sustainer.network`,
  //     {
  //       payload,
  //       traceId,
  //       sourceCommand,
  //       issuedTimestamp: datetime.fineTimestamp(),
  //       issuerInfo
  //     }
  //   );
  // });
});
