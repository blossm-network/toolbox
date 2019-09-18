const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, replaceGetter, fake } = require("sinon");
const mongoose = require("mongoose");
const urlEncodeQueryData = require("@sustainers/url-encode-query-data");

const { connect } = require("../index");

const urlProtocol = "protocol";
const user = "user";
const password = "pass";
const host = "host";
const database = "db";

const baseConnectionString = `${urlProtocol}://${user}:${password}@${host}/${database}`;

describe("Connects", () => {
  afterEach(() => {
    restore();
  });
  beforeEach(() => {
    replace(mongoose, "connect", fake());
    replace(mongoose.connection, "on", fake());
    replace(mongoose.connection, "once", fake());
  });

  it("it should connect if all the params are normal, and ommittable params omitted", () => {
    connect({ urlProtocol, user, password, host, database });

    expect(mongoose.connect).to.have.been.calledWith(baseConnectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
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
      urlProtocol,
      user,
      password,
      host,
      database,
      parameters,
      poolSize,
      autoIndex
    });

    expect(mongoose.connect).to.have.been.calledWith(
      `${baseConnectionString}?${urlEncodeQueryData(parameters)}`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        autoIndex,
        poolSize
      }
    );
  });

  it("it pass along the onError callback", () => {
    const onError = name => name;

    connect({
      urlProtocol,
      user,
      password,
      host,
      database,
      onError
    });

    expect(mongoose.connection.on).to.have.been.calledWith("error", onError);
  });

  it("it pass along the onError callback", () => {
    const onOpen = () => true;

    connect({
      urlProtocol,
      user,
      password,
      host,
      database,
      onOpen
    });

    expect(mongoose.connection.once).to.have.been.calledWith("open", onOpen);
  });
});

describe("Returns the right object", () => {
  afterEach(() => {
    restore();
  });

  it("it should connect if all the params are normal, and ommittable params omitted", () => {
    const returnValue = "pumpkin";
    replace(mongoose, "connect", fake());
    replaceGetter(mongoose, "connection", fake.returns(returnValue));

    expect(connect({ urlProtocol, user, password, host, database })).to.equal(
      returnValue
    );
  });
});
