const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const normalizeCommand = require("../");

const deps = require("../deps");

const payload = "some-payload";

const issued = "some-issued";
const trace = "some-trace";
const source = "some-source";
const uuid = "some-uuid";

const root = "some-root";

describe("Normalize command", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    const params = {
      root,
      payload,
      headers: {
        issued,
        trace,
        source
      }
    };

    const result = await normalizeCommand(params);

    expect(result).to.deep.equal({
      root,
      headers: {
        id: uuid,
        issued,
        trace,
        source
      },
      payload
    });
  });
  it("should get called with expected params with optionals omitted", async () => {
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    const params = {
      payload,
      headers: {
        uuid,
        issued
      }
    };

    const result = await normalizeCommand(params);

    expect(result).to.deep.equal({
      headers: {
        id: uuid,
        issued
      },
      payload
    });
  });
});
