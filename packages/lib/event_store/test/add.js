const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const storeInstance = "some-instance";
process.env.STORE_INSTANCE = storeInstance;
const deps = require("../deps");

describe("Normalized event store add", () => {
  afterEach(() => {
    restore();
  });

  it("should call add with the correct params if table exists", async () => {
    const insertFake = fake();
    const table = {
      exists: () => true,
      insert: row => insertFake(row)
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("../index");

    const storeId = "store";

    const root = "root";
    const timestamp = 1234;

    const event = {
      fact: {
        root,
        timestamp
      },
      payload: {
        a: 3
      }
    };

    await normalizedEventStore({ storeId }).add({ event });

    expect(tableFake).to.have.been.calledWith(storeId);
    expect(instanceFake).to.have.been.calledWith(storeInstance);
    expect(insertFake).to.have.been.calledWith({
      key: `${root}#${timestamp}`,
      data: { a: { a: JSON.stringify(event) } }
    });
  });
  it("should call add with the correct params if table does not exists", async () => {
    const insertFake = fake();
    const createFake = fake();

    const table = {
      exists: () => false,
      create: createFake,
      insert: insertFake
    };
    const tableFake = fake.returns(table);

    const instanceFake = fake.returns({
      table: tableFake
    });

    replace(deps.bigtable, "instance", instanceFake);

    const normalizedEventStore = require("../index");

    const storeId = "store";

    const root = "root";
    const timestamp = 1234;

    const event = {
      fact: {
        root,
        timestamp
      },
      payload: {
        a: 3
      }
    };

    await normalizedEventStore({ storeId }).add({ event });

    expect(tableFake).to.have.been.calledWith(storeId);
    expect(instanceFake).to.have.been.calledWith(storeInstance);
    expect(createFake).to.have.been.calledWith({
      families: [{ name: "a" }]
    });
    expect(insertFake).to.have.been.calledWith({
      key: `${root}#${timestamp}`,
      data: { a: { a: JSON.stringify(event) } }
    });
  });
});
