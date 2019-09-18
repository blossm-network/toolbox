const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const mongoose = require("mongoose");

const { init } = require("../index");

const name = "collection";
const commonKey = "key";
const schema0 = {};
const schema0Value = "value0";
schema0[commonKey] = { type: String, default: schema0Value };

const schema1 = {};
const schema1Value = "value1";
schema1[commonKey] = { type: String, default: schema1Value };

const mixin0 = { schema: schema0 };
const mixin1 = { schema: schema1 };

describe("Returns a model", () => {
  afterEach(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
  });

  it("it should return a model object that is instatiatable", () => {
    const name = "collection";

    const mixins = [mixin0, mixin1];
    const modelObject = init({ name, mixins });

    expect(new modelObject()).to.exist;
  });

  it("it should apply the mixin schema to the model", () => {
    const name = "collection";
    const mixins = [mixin1];

    const modelObject = init({ name, mixins });

    const modelObjectInstance = new modelObject();
    expect(modelObjectInstance[commonKey]).to.equal(schema1Value);
  });
  it("it should apply the version to the model", () => {
    const version = 1;

    const name = "collection";
    const mixins = [];

    const modelObject = init({
      name,
      mixins,
      version
    });

    const modelObjectInstance = new modelObject();
    expect(modelObjectInstance.version).to.equal(version);
  });

  it("it should apply mixins in the correct order", () => {
    const version = 1;

    const mixins = [mixin0, mixin1];
    const modelObject = init({
      name,
      mixins,
      version
    });

    const modelObjectInstance = new modelObject();
    expect(modelObjectInstance[commonKey]).to.equal(schema1Value);
  });

  it("it should apply mixins in the correct order if a base is provided", () => {
    const version = 1;

    const name = "collection";

    const mixins = [mixin1];
    const modelObject = init({
      name,
      schema: schema0,
      mixins,
      version
    });

    const modelObjectInstance = new modelObject();
    expect(modelObjectInstance[commonKey]).to.equal(schema0Value);
  });
  it("it should connect if a connection string is passed in", () => {
    replace(mongoose, "connect", fake());
    replace(mongoose.connection, "on", fake());
    replace(mongoose.connection, "once", fake());
    const name = "collection";

    const mixins = [mixin0, mixin1];

    const urlProtocol = "protocol";
    const user = "user";
    const password = "pass";
    const host = "host";
    const database = "db";

    const modelObject = init({
      name,
      mixins,
      connection: {
        urlProtocol,
        user,
        password,
        host,
        database
      }
    });

    expect(new modelObject()).to.exist;

    const baseConnectionString = `${urlProtocol}://${user}:${password}@${host}/${database}`;

    expect(mongoose.connect).to.have.been.calledWith(baseConnectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
      autoIndex: false,
      poolSize: 10
    });

    restore();
  });
});

describe("Throws if no name", () => {
  afterEach(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
  });

  it("it should throw if it doesnt have a name", () => {
    const mixin1 = { viewMethods: { x: () => 0 } };
    const mixin2 = { viewMethods: { y: () => 0 } };

    const mixins = [mixin1, mixin2];

    expect(() => init({ mixins })).to.throw();
  });
});
