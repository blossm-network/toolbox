const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const eventStore = require("..");

const deps = require("../deps");
const { string: dateString } = require("@sustainers/datetime");

let clock;

const now = new Date();

const payload = {
  a: 1,
  b: 2
};

const root = "root";
const topic = "topic";
const version = "version";
const commandId = "commandId";
const commandAction = "command-action";
const commandDomain = "command-domain";
const commandService = "command-service";
const commandIssuedTimestamp = 234;
const service = "the-service-the-event-was-triggered-in";
const network = "some-network";
const domain = "the-domain-the-event-was-triggered-in";

const context = "some-context";
const tokenFn = "some-token-fn";

describe("Event store", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call add with the right params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    const trace = "trace";

    await eventStore({ domain, service, network })
      .add({
        context,
        headers: {
          root,
          topic,
          version,
          trace,
          domain,
          service,
          network,
          command: {
            action: commandAction,
            domain: commandDomain,
            service: commandService,
            id: commandId,
            issued: commandIssuedTimestamp
          }
        },
        payload
      })
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(`event-store.${domain}`);
    expect(postFake).to.have.been.calledWith({
      context,
      headers: {
        root,
        topic,
        version,
        domain,
        service,
        network,
        command: {
          id: commandId,
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          issued: commandIssuedTimestamp
        },
        trace,
        created: dateString()
      },
      payload
    });
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });

  it("should call add with the right params and optionals left out", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const postFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      post: postFake
    });
    replace(deps, "operation", operationFake);

    await eventStore({ domain, service, network })
      .add({
        context,
        headers: {
          root,
          topic,
          command: {
            action: commandAction,
            domain: commandDomain,
            service: commandService,
            id: commandId,
            issued: commandIssuedTimestamp
          },
          version
        },
        payload
      })
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith(`event-store.${domain}`);
    expect(postFake).to.have.been.calledWith({
      context,
      headers: {
        root,
        topic,
        version,
        domain,
        service,
        network,
        command: {
          action: commandAction,
          domain: commandDomain,
          service: commandService,
          id: commandId,
          issued: commandIssuedTimestamp
        },
        created: dateString()
      },
      payload
    });
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });

  it("should call aggregate with the right params", async () => {
    const withFake = fake();
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const operationFake = fake.returns({
      get: getFake
    });
    replace(deps, "operation", operationFake);

    const root = "user";

    await eventStore({ service, network })
      .aggregate(root)
      .in(context)
      .with(tokenFn);

    expect(operationFake).to.have.been.calledWith("event-store");
    expect(getFake).to.have.been.calledWith(root);
    expect(inFake).to.have.been.calledWith({ context, service, network });
    expect(withFake).to.have.been.calledWith({ tokenFn });
  });
});
