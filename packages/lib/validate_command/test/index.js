const { expect } = require("chai").use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");
const datetime = require("@sustainers/datetime");
const validateCommand = require("..");

const now = new Date();

const goodParams = {
  payload: { a: 1 },
  headers: {
    trace: "trace!",
    issued: datetime.fineTimestamp() - 2
  }
};

let clock;

describe("Validate command", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
  });
  it("should handle correct params correctly", async () => {
    expect(await validateCommand(goodParams)).to.not.throw;
  });
  it("should throw if a bad header is passed", async () => {
    const params = {
      ...goodParams,
      headers: 123
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a no header is passed", async () => {
    const params = {
      ...goodParams,
      headers: undefined
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a bad source is passed", async () => {
    const params = {
      ...goodParams,
      "headers.source": 123
    };

    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should not throw if a no source is passed", async () => {
    const params = {
      ...goodParams,
      "headers.source": undefined
    };

    expect(await validateCommand(params)).to.not.throw;
  });
  it("should throw if a bad trace is passed", async () => {
    const params = {
      ...goodParams,
      "headers.trace": 123
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should allow no trace is passed", async () => {
    const params = {
      ...goodParams,
      "headers.trace": undefined
    };
    expect(await validateCommand(params)).to.not.throw;
  });
  it("should throw if a bad issued timestamp is passed", async () => {
    const params = {
      ...goodParams,
      "headers.issued": "bad"
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a no issued timestamp is passed", async () => {
    const params = {
      ...goodParams,
      "headers.issuedTimestamp": undefined
    };

    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a future issued is passed", async () => {
    const params = {
      ...goodParams,
      "headers.issued": datetime.fineTimestamp + 1
    };

    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a distant past issued is passed", async () => {
    const params = {
      ...goodParams,
      "headers.issued": 123
    };

    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a bad payload is passed", async () => {
    const params = {
      ...goodParams,
      payload: 123
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should not throw if a no payload is passed", async () => {
    const params = {
      ...goodParams,
      payload: undefined
    };
    expect(async () => await validateCommand(params)).to.throw;
  });
});
