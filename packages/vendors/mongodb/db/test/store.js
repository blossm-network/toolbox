const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, replaceGetter, fake } = require("sinon");
const { store } = require("../index");

const name = "some-name";
const commonKey = "key";
const schema = {};
const schemaValue = "some-schema-value";
schema[commonKey] = { type: String, default: schemaValue };

const deps = require("../deps");

describe("Store", () => {
  afterEach(() => {
    restore();
  });

  it("it should return a model object that is instatiatable", () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = "some-model-object";
    const modelFake = fake.returns(modelObject);
    replace(deps.mongoose, "model", modelFake);

    const schema = "some-schema";
    const indexPart1 = "some-index-part-1";
    const indexPart2 = "some-index-part-2";
    const indexes = [[indexPart1, indexPart2]];
    const typeKey = "some-type-key";
    const result = store({ name, schema, indexes, typeKey });

    expect(result).to.equal(modelObject);
    expect(modelFake).to.have.been.calledWith(name, schemaObj, name);
    expect(schemaFake).to.have.been.calledWith(schema, {
      strict: true,
      typePojoToMixed: false,
      minimize: false,
      versionKey: false,
      useNestedStrict: true,
      typeKey,
    });
    expect(indexFake.getCall(0)).to.have.been.calledWith(
      indexPart1,
      indexPart2
    );
  });
  it("it should return a model object with optionals missing", () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = "some-model-object";
    const modelFake = fake.returns(modelObject);
    replace(deps.mongoose, "model", modelFake);

    const result = store({ name });

    expect(result).to.equal(modelObject);
    expect(modelFake).to.have.been.calledWith(name, schemaObj, name);
    expect(schemaFake).to.have.been.calledWith(
      {},
      {
        strict: false,
        typePojoToMixed: false,
        versionKey: false,
        minimize: false,
        useNestedStrict: true,
      }
    );
    expect(indexFake).to.not.have.been.called;
  });
  it("it should return a model object with connection properties passed in", () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = "some-model-object";
    const modelFake = fake.returns(modelObject);
    replace(deps.mongoose, "model", modelFake);

    const schema = "some-schema";
    const indexPart1 = "some-index-part-1";
    const indexPart2 = "some-index-part-2";
    const indexes = [[indexPart1, indexPart2]];
    const onFake = fake();
    const onceFake = fake();
    const connectFake = fake();
    const connectionFake = fake.returns({
      on: onFake,
      once: onceFake,
    });

    replace(deps.mongoose, "connect", connectFake);
    replaceGetter(deps.mongoose, "connection", connectionFake);
    const name = "collection";

    const user = "soem-user";
    const password = "some-pass";
    const host = "some-host";
    const database = "some-db";
    const protocol = "some-protocol";
    const result = store({
      name,
      schema,
      indexes,
      connection: {
        protocol,
        user,
        password,
        host,
        database,
      },
    });

    expect(result).to.equal(modelObject);
    expect(modelFake).to.have.been.calledWith(name, schemaObj, name);
    expect(schemaFake).to.have.been.calledWith(schema, {
      strict: true,
      typePojoToMixed: false,
      versionKey: false,
      minimize: false,
      useNestedStrict: true,
    });
    expect(indexFake.getCall(0)).to.have.been.calledWith(
      indexPart1,
      indexPart2
    );
    const baseConnectionString = `${protocol}://${user}:${password}@${host}/${database}`;

    expect(connectFake).to.have.been.calledWith(baseConnectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      versionKey: false,
      autoIndex: false,
      poolSize: 5,
    });
  });

  it("it should throw if it doesnt have a name", () => {
    const error = "some-error";
    const internalServerMessageErrorFake = fake.returns(error);
    replace(deps, "internalServerError", {
      message: internalServerMessageErrorFake,
    });

    try {
      store({});

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(internalServerMessageErrorFake).to.have.been.calledWith(
        "This store needs a name."
      );
      expect(e).to.equal(error);
    }
  });
});
