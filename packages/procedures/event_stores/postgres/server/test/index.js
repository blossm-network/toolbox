import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import eventStore from "../index.js";
import deps from "../deps.js";

describe("Postgres event store server", () => {
  afterEach(restore);

  it("should compose persistence functions into the existing event store", async () => {
    const database = { end: fake.resolves() };
    const stores = {
      eventStore: "events",
      snapshotStore: "snapshots",
      countsStore: "counts",
      blockchainStore: "blockchain",
      publicationsStore: "publications",
    };
    replace(deps, "db", { connect: fake.returns(database) });
    replace(deps, "stores", fake.resolves(stores));
    const operationNames = Object.keys(deps).filter(
      (name) => !["db", "stores", "eventStore"].includes(name)
    );
    for (const name of operationNames) replace(deps, name, fake.returns(name));
    replace(deps, "eventStore", fake.resolves("server"));

    const options = {
      connection: { host: "database", max: 4 },
      namespace: "bicycle",
      indexes: ["color"],
      handlers: { paint: () => {} },
      publishFn: () => {},
      encryptFn: () => {},
      createBlockFn: () => {},
      signFn: () => {},
      blockPublisherPublicKeyFn: () => {},
      isPublic: true,
    };
    expect(await eventStore(options)).to.equal("server");
    expect(deps.db.connect.firstCall.args).to.deep.equal([options.connection]);
    expect(deps.stores.firstCall.args).to.deep.equal([
      { database, namespace: "bicycle", indexes: ["color"] },
    ]);
    expect(deps.saveEvents.firstCall.args).to.deep.equal([
      {
        eventStore: "events",
        publicationsStore: "publications",
        handlers: options.handlers,
      },
    ]);
    expect(deps.publishPending.firstCall.args).to.deep.equal([
      { publicationsStore: "publications", publishFn: options.publishFn },
    ]);
    expect(deps.createTransaction.firstCall.args).to.deep.equal([{ database }]);
    for (const name of ["findSnapshots", "findOneSnapshot", "saveSnapshot"])
      expect(deps[name].firstCall.args).to.deep.equal([
        { snapshotStore: "snapshots" },
      ]);
    for (const name of ["reserveRootCounts", "rootStream", "count"])
      expect(deps[name].firstCall.args).to.deep.equal([
        { countsStore: "counts" },
      ]);
    for (const name of ["saveBlock", "latestBlock"])
      expect(deps[name].firstCall.args).to.deep.equal([
        { blockchainStore: "blockchain" },
      ]);
    const composition = deps.eventStore.firstCall.args[0];
    for (const name of operationNames)
      expect(composition[`${name}Fn`]).to.equal(name);
    for (const name of [
      "handlers",
      "encryptFn",
      "createBlockFn",
      "signFn",
      "blockPublisherPublicKeyFn",
      "isPublic",
    ])
      expect(composition[name]).to.equal(options[name]);
    expect(database.end.called).to.equal(false);
  });

  it("should close its pool if table preparation fails", async () => {
    const database = { end: fake.resolves() };
    const error = new Error("schema unavailable");
    replace(deps, "db", { connect: fake.returns(database) });
    replace(deps, "stores", fake.rejects(error));
    let caught;
    try {
      await eventStore();
    } catch (err) {
      caught = err;
    }
    expect(caught).to.equal(error);
    expect(database.end.calledOnce).to.equal(true);
  });

  it("retains local mode without writing or dispatching publications", async () => {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    try {
      replace(deps, "db", { connect: fake.returns({ end: fake.resolves() }) });
      replace(
        deps,
        "stores",
        fake.resolves({
          eventStore: {},
          snapshotStore: {},
          countsStore: {},
          blockchainStore: {},
          publicationsStore: {},
        })
      );
      replace(deps, "saveEvents", fake.returns("save-events"));
      replace(deps, "publishPending", fake());
      replace(deps, "eventStore", fake.resolves());
      await eventStore({ handlers: {} });
      expect(deps.saveEvents.firstCall.args[0].publicationsStore).to.equal(
        undefined
      );
      expect(deps.publishPending.called).to.equal(false);
      expect(deps.eventStore.firstCall.args[0].publishPendingFn).to.equal(
        undefined
      );
    } finally {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
    }
  });
});
