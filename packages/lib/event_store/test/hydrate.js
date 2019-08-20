const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const storeInstance = "some-instance";
process.env.STORE_INSTANCE = storeInstance;
const deps = require("../deps");

const storeId = "store";
const service = "some-service";

const root = "root";
describe("Normalized event store hydrate", () => {
  afterEach(() => {
    restore();
  });

  it("should call hydrate with the correct params if table exists", async () => {
    const payload = {
      a: 1
    };
    const data = {
      payload
    };

    const readStringFake = fake.returns({
      on: (status, fn) => {
        switch (status) {
        case "error":
          return readStringFake();
        case "data":
          fn({ data });
          return readStringFake();
        case "end":
          fn();
          break;
        }
      }
    });

    const table = {
      exists: () => true,
      createReadStream: readStringFake
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("..");

    const result = await normalizedEventStore({ storeId, service }).hydrate({
      root
    });

    expect(result).to.deep.equal(payload);
    expect(tableFake).to.have.been.calledWith(`${service}-${storeId}`);
    expect(instanceFake).to.have.been.calledWith(storeInstance);
    expect(readStringFake).to.have.been.calledWith({
      prefix: root,
      filter: [{ column: { cellLimit: 1 } }]
    });
  });
  it("should call hydrate with the correct params if table does not exists", async () => {
    const data = {
      a: 1
    };

    const readStringFake = fake.returns({
      on: (status, fn) => {
        switch (status) {
        case "error":
          return readStringFake();
        case "data":
          fn({ data });
          return readStringFake();
        case "end":
          fn();
          break;
        }
      }
    });

    const table = {
      exists: () => false,
      createReadStream: readStringFake
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("..");

    const result = await normalizedEventStore({ storeId, service }).hydrate({
      root
    });

    expect(tableFake).to.have.been.calledWith(`${service}-${storeId}`);
    expect(instanceFake).to.have.been.calledWith(storeInstance);
    expect(result).to.be.null;
  });
  it("should call hydrate and throw error if needed", async () => {
    const payload = {
      a: 1
    };
    const data = {
      payload
    };

    const readStringFake = fake.returns({
      on: (status, fn) => {
        switch (status) {
        case "error":
          fn(new Error());
          break;
        case "data":
          fn({ data });
          return readStringFake();
        case "end":
          fn();
          break;
        }
      }
    });

    const table = {
      exists: () => true,
      createReadStream: readStringFake
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("../index");

    const storeId = "store";

    const root = "root";

    expect(
      async () => await normalizedEventStore({ storeId }).hydrate({ root })
    ).to.throw;
  });
  it("should call hydrate with the correct params and correct reducing if exists", async () => {
    const payload0 = {
      a: 1,
      b: 2
    };
    const payload1 = {
      a: 2,
      c: 4
    };
    const data0 = {
      payload: payload0
    };
    const data1 = {
      payload: payload1
    };

    const readStringFake = fake.returns({
      on: (status, fn) => {
        switch (status) {
        case "error":
          return readStringFake();
        case "data":
          fn({ data: data0 });
          fn({ data: data1 });
          return readStringFake();
        case "end":
          fn();
          break;
        }
      }
    });

    const table = {
      exists: () => true,
      createReadStream: readStringFake
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("..");

    const result = await normalizedEventStore({ storeId, service }).hydrate({
      root
    });

    expect(result).to.deep.equal({ a: 2, b: 2, c: 4 });
    expect(tableFake).to.have.been.calledWith(`${service}-${storeId}`);
    expect(instanceFake).to.have.been.calledWith(storeInstance);
    expect(readStringFake).to.have.been.calledWith({
      prefix: root,
      filter: [{ column: { cellLimit: 1 } }]
    });
  });
});
