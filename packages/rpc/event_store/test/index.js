const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const eventStore = require("..");

const deps = require("../deps");
const { string: dateString } = require("@blossm/datetime");

let clock;

const now = new Date();

const payload = {
  a: 1,
  b: 2
};

const root = "root";
const topic = "topic";
const version = "version";
const eventAction = "some-event-action";
const eventDomain = "some-event-domain";
const eventService = "some-event-service";
const commandId = "commandId";
const commandAction = "command-action";
const commandDomain = "command-domain";
const commandService = "command-service";
const commandNetwork = "command-network";
const commandIssuedTimestamp = 234;
const service = "the-service-the-event-was-triggered-in";
const network = "some-network";
const domain = "the-domain-the-event-was-triggered-in";

const context = "some-context";
const session = "some-session";
const tokenFn = "some-token-fn";
const number = "some-number";

const query = {
  key: "some-key",
  value: "some-value"
};

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
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    const trace = "trace";

    await eventStore({ domain, service, network })
      .set({ context, session, tokenFn })
      .add(
        {
          headers: {
            root,
            topic,
            action: eventAction,
            domain: eventDomain,
            service: eventService,
            version,
            trace,
            command: {
              action: commandAction,
              domain: commandDomain,
              service: commandService,
              network: commandNetwork,
              id: commandId,
              issued: commandIssuedTimestamp
            }
          },
          payload
        },
        { number }
      );

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(postFake).to.have.been.calledWith({
      event: {
        headers: {
          root,
          context,
          session,
          topic,
          action: eventAction,
          domain: eventDomain,
          service: eventService,
          version,
          command: {
            id: commandId,
            action: commandAction,
            domain: commandDomain,
            service: commandService,
            network: commandNetwork,
            issued: commandIssuedTimestamp
          },
          trace,
          created: dateString()
        },
        payload
      },
      number
    });
    expect(inFake).to.have.been.calledWith({
      context,
      session,
      service,
      network
    });
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
    const rpcFake = fake.returns({
      post: postFake
    });
    replace(deps, "rpc", rpcFake);

    await eventStore({ domain }).add({
      headers: {
        root,
        topic,
        action: eventAction,
        domain: eventDomain,
        service: eventService,
        version
      },
      payload
    });

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(postFake).to.have.been.calledWith({
      event: {
        headers: {
          root,
          topic,
          action: eventAction,
          domain: eventDomain,
          service: eventService,
          version,
          created: dateString()
        },
        payload
      }
    });
    expect(inFake).to.have.been.calledWith({});
    expect(withFake).to.have.been.calledWith();
  });

  it("should call aggregate with the right params", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const root = "user";

    const result = await eventStore({ domain, service, network })
      .set({ context, session, tokenFn })
      .aggregate(root);

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(getFake).to.have.been.calledWith({ root });
    expect(inFake).to.have.been.calledWith({
      context,
      session,
      service,
      network
    });
    expect(withFake).to.have.been.calledWith({ tokenFn });
    expect(result).to.equal(aggregate);
  });
  it("should call aggregate with the right params with optionals missing", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const root = "user";

    const result = await eventStore({ domain, service, network }).aggregate(
      root
    );

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(getFake).to.have.been.calledWith({ root });
    expect(inFake).to.have.been.calledWith({ service, network });
    expect(withFake).to.have.been.calledWith();
    expect(result).to.equal(aggregate);
  });
  it("should call query with the right params", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service, network })
      .set({ context, session, tokenFn })
      .query(query);

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({
      context,
      session,
      service,
      network
    });
    expect(withFake).to.have.been.calledWith({ tokenFn });
    expect(result).to.equal(aggregate);
  });
  it("should call aggregate with the right params with optionals missing", async () => {
    const aggregate = "some-aggregate";
    const withFake = fake.returns(aggregate);
    const inFake = fake.returns({
      with: withFake
    });
    const getFake = fake.returns({
      in: inFake
    });
    const rpcFake = fake.returns({
      get: getFake
    });
    replace(deps, "rpc", rpcFake);

    const result = await eventStore({ domain, service, network }).query(query);

    expect(rpcFake).to.have.been.calledWith(domain, "event-store");
    expect(getFake).to.have.been.calledWith(query);
    expect(inFake).to.have.been.calledWith({ service, network });
    expect(withFake).to.have.been.calledWith();
    expect(result).to.equal(aggregate);
  });
});
