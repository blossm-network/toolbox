const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, replaceGetter, fake } = require("sinon");
const mongoose = require("mongoose");

const { connect } = require("../index");
const deps = require("../deps");

const protocol = "some-protocol";
const user = "user";
const password = "pass";
const host = "host";
const database = "db";

const baseConnectionString = `${protocol}://${user}:${password}@${host}/${database}`;

const onFake = fake();
const onceFake = fake();
const connectFake = fake();
const connectionFake = fake.returns({
  on: onFake,
  once: onceFake
});

describe("Connects", () => {
  afterEach(() => {
    restore();
  });
  beforeEach(() => {
    replace(mongoose, "connect", connectFake);
    replaceGetter(mongoose, "connection", connectionFake);
  });

  it("it should connect if all the params are normal, and ommittable params omitted", () => {
    connect({ protocol, user, password, host, database });

    expect(connectFake).to.have.been.calledWith(baseConnectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      autoIndex: false,
      poolSize: 10
    });
  });

  it("it should connect if all the params are normal, and ommittable params are passed in", () => {
    const paramKey0 = "key0";
    const paramValue0 = "value0";
    const parameters = {};
    parameters[paramKey0] = paramValue0;

    const poolSize = 1;
    const autoIndex = true;

    connect({
      protocol,
      user,
      password,
      host,
      database,
      parameters,
      poolSize,
      autoIndex
    });

    expect(connectFake).to.have.been.calledWith(
      `${baseConnectionString}?${deps.urlEncodeQueryData(parameters)}`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        autoIndex,
        poolSize
      }
    );
  });

  it("it pass along the onError callback", () => {
    const onError = name => name;

    connect({
      protocol,
      user,
      password,
      host,
      database,
      onError
    });

    expect(onFake).to.have.been.calledWith("error", onError);
  });

  it("it pass along the onError callback", () => {
    const onOpen = () => true;

    connect({
      protocol,
      user,
      password,
      host,
      database,
      onOpen
    });

    expect(onceFake).to.have.been.calledWith("open", onOpen);
  });
});

describe("Returns the right object", () => {
  afterEach(() => {
    restore();
  });

  it("it should connect if all the params are normal, and ommittable params omitted", () => {
    const onceFake = fake();
    const onFake = fake();
    const returnValue = {
      on: onFake,
      once: onceFake
    };
    replace(mongoose, "connect", fake());
    replaceGetter(mongoose, "connection", fake.returns(returnValue));

    expect(connect({ protocol, user, password, host, database })).to.equal(
      returnValue
    );

    expect(onceFake).to.have.been.calledOnce;
    expect(onFake).to.have.been.calledOnce;
  });
});
