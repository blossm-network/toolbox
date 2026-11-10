import * as chai from "chai";
import { EventEmitter } from "node:events";
import sinonChai from "sinon-chai";
import { restore, replace, replaceGetter, fake } from "sinon";

import { connect } from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const protocol = "some-protocol";
const user = "user";
const password = "pass";
const host = "host";
const database = "db";

const baseConnectionString = `${protocol}://${user}:${password}@${host}/${database}`;

const onFake = fake();
const onceFake = fake();
const connectFake = fake.resolves();
const connectionFake = fake.returns({
  on: onFake,
  once: onceFake,
});

describe("Connects", () => {
  afterEach(() => {
    restore();
  });
  beforeEach(() => {
    replace(deps.mongoose, "connect", connectFake);
    replaceGetter(deps.mongoose, "connection", connectionFake);
  });

  it("it should connect if all the params are normal, and ommittable params omitted", async () => {
    await connect({ protocol, user, password, host, database });

    expect(connectFake).to.have.been.calledWith(baseConnectionString, {
      autoIndex: false,
      maxPoolSize: 5,
    });
  });

  it("it should connect if all the params are normal, and ommittable params are passed in", async () => {
    const paramKey0 = "key0";
    const paramValue0 = "value0";
    const parameters = { some: "params" };
    parameters[paramKey0] = paramValue0;

    const poolSize = 1;
    const autoIndex = true;

    const url = "some-url";
    const urlEncodeQueryDataFake = fake.returns(url);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    await connect({
      protocol,
      user,
      password,
      host,
      database,
      parameters,
      poolSize,
      autoIndex,
    });

    expect(urlEncodeQueryDataFake).to.have.been.calledWith(
      baseConnectionString,
      parameters
    );

    expect(connectFake).to.have.been.calledWith(url, {
      autoIndex,
      maxPoolSize: poolSize,
    });
  });

  it("registers lifecycle handlers before the connection opens", async () => {
    restore();
    const connection = new EventEmitter();
    const onOpen = fake();
    const onError = fake();
    replaceGetter(deps.mongoose, "connection", fake.returns(connection));
    replace(
      deps.mongoose,
      "connect",
      fake(async () => {
        expect(connection.listenerCount("error")).to.equal(1);
        connection.emit("open");
        expect(onOpen.callCount).to.equal(1);
      })
    );
    await connect({
      protocol,
      user,
      password,
      host,
      database,
      onOpen,
      onError,
    });
  });

  for (const [label, username, secret] of [
    ["reserved characters and Unicode", "user/:@%#雪", "pass/:@%#雪"],
    ["literal percent escapes", "user%2Fname", "pass%40word%25"],
    ["URI delimiters", "user?&=+[]", "pass?&=+[]"],
  ]) {
    it(`round-trips credentials containing ${label} through the real driver parser`, async () => {
      const previousCalls = connectFake.callCount;
      await connect({
        protocol: "mongodb",
        user: username,
        password: secret,
        host: "localhost",
        database,
      });
      expect(connectFake.callCount).to.equal(previousCalls + 1);
      const [uri] = connectFake.lastCall.args;
      const client = new deps.mongoose.mongo.MongoClient(uri);
      expect(client.options.credentials.username).to.equal(username);
      expect(client.options.credentials.password).to.equal(secret);
    });
  }

  it("preserves multiple hosts, database and query options around encoded credentials", async () => {
    await connect({
      protocol: "mongodb",
      user: "user@name",
      password: "secret/password",
      host: "mongo-a:27017,mongo-b:27018",
      database,
      parameters: { replicaSet: "rs-test", authSource: "admin" },
    });
    const [uri] = connectFake.lastCall.args;
    const client = new deps.mongoose.mongo.MongoClient(uri);
    expect(client.options.hosts.map((address) => address.toString())).to.deep.equal([
      "mongo-a:27017",
      "mongo-b:27018",
    ]);
    expect(client.options.dbName).to.equal(database);
    expect(client.options.replicaSet).to.equal("rs-test");
    expect(client.options.credentials.source).to.equal("admin");
  });

  it("it pass along the onError callback", async () => {
    const onError = (name) => name;

    await connect({
      protocol,
      user,
      password,
      host,
      database,
      onError,
    });

    expect(onFake).to.have.been.calledWith("error", onError);
  });

  it("it pass along the onError callback", async () => {
    const onOpen = () => true;

    await connect({
      protocol,
      user,
      password,
      host,
      database,
      onOpen,
    });

    expect(onceFake).to.have.been.calledWith("open", onOpen);
  });
});

describe("Returns the right object", () => {
  afterEach(() => {
    restore();
  });

  it("it should connect if all the params are normal, and ommittable params omitted", async () => {
    const onceFake = fake();
    const onFake = fake();
    const returnValue = {
      on: onFake,
      once: onceFake,
    };
    replace(deps.mongoose, "connect", fake());
    replaceGetter(deps.mongoose, "connection", fake.returns(returnValue));

    expect(
      await connect({ protocol, user, password, host, database })
    ).to.equal(returnValue);

    expect(onceFake).to.have.been.calledOnce;
    expect(onFake).to.have.been.calledOnce;
  });
});
