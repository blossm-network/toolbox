import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, replaceGetter, fake } from "sinon";
import { store } from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const name = "some-name";
const commonKey = "key";
const schema = {};
const schemaValue = "some-schema-value";
schema[commonKey] = { type: String, default: schemaValue };


describe("Store", () => {
  afterEach(() => {
    restore();
  });

  it("it should return a model object that is instatiatable", async () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = { init: fake.resolves() };
    const modelFake = fake.returns(modelObject);
    replace(deps.mongoose, "model", modelFake);

    const schema = "some-schema";
    const indexPart1 = "some-index-part-1";
    const indexPart2 = "some-index-part-2";
    const indexes = [[indexPart1, indexPart2]];
    const typeKey = "some-type-key";
    const result = await store({ name, schema, indexes, typeKey });

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
  it("it should return a model object with optionals missing", async () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = { init: fake.resolves() };
    const modelFake = fake.returns(modelObject);
    replace(deps.mongoose, "model", modelFake);

    const result = await store({ name });

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
  it("it should return a model object with connection properties passed in", async () => {
    const indexFake = fake();

    const schemaObj = {
      index: indexFake,
    };

    const schemaFake = fake.returns(schemaObj);
    replace(deps.mongoose, "Schema", schemaFake);

    const modelObject = { init: fake.resolves() };
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
    const result = await store({
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
      autoIndex: false,
      maxPoolSize: 5,
    });
  });

  it("it should throw if it doesnt have a name", async () => {
    const error = "some-error";
    const internalServerMessageErrorFake = fake.returns(error);
    replace(deps, "internalServerError", {
      message: internalServerMessageErrorFake,
    });

    try {
      await store({});

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(internalServerMessageErrorFake).to.have.been.calledWith(
        "This store needs a name."
      );
      expect(e).to.equal(error);
    }
  });
  it("waits for connection and index initialization before returning its model", async () => {
    let connected;
    let indexed;
    const connecting = new Promise((resolve) => { connected = resolve; });
    const indexing = new Promise((resolve) => { indexed = resolve; });
    const model = { init: fake.returns(indexing) };
    const modelFake = fake.returns(model);
    replace(deps.mongoose, "model", modelFake);
    replace(deps.mongoose, "connect", fake.returns(connecting));
    const pending = store({ name, connection: { protocol: "mongodb", user: "u", password: "p", host: "h", database: "d" } });
    await Promise.resolve();
    expect(modelFake).to.not.have.been.called;
    connected();
    await new Promise((resolve) => setImmediate(resolve));
    expect(model.init).to.have.been.calledOnce;
    let ready = false;
    pending.then(() => { ready = true; });
    await Promise.resolve();
    expect(ready).to.equal(false);
    indexed();
    expect(await pending).to.equal(model);
  });

  for (const failure of ["connection", "indexes"]) {
    it(`rejects startup when ${failure} fails`, async () => {
      const error = new Error("startup failure");
      const model = { init: fake.rejects(error) };
      const modelFake = fake.returns(model);
      const connectFake = failure == "connection" ? fake.rejects(error) : fake.resolves();
      replace(deps.mongoose, "model", modelFake);
      replace(deps.mongoose, "connect", connectFake);
      let actual;
      try {
        await store({ name, connection: { protocol: "mongodb", user: "u", password: "p", host: "h", database: "d" } });
      } catch (err) {
        actual = err;
      }
      expect(actual).to.equal(error);
      if (failure == "connection") {
        expect(connectFake.callCount).to.equal(10);
        expect(modelFake).to.not.have.been.called;
      }
    });
  }

});
