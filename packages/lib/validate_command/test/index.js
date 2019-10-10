const { expect } = require("chai").use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");
const { string: stringDate, stringFromDate } = require("@sustainers/datetime");
const validateCommand = require("..");

const now = new Date();

const goodParams = {
  payload: { a: 1 },
  headers: {
    trace: "trace!",
    issued: stringDate()
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
    try {
      await validateCommand(params);

      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
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
      "headers.issued": stringFromDate(new Date(now.getTime() + 60000))
    };

    expect(async () => await validateCommand(params)).to.throw;
  });
  it("should throw if a distant past issued is passed", async () => {
    const params = {
      ...goodParams,
      "headers.issued": stringFromDate(new Date(234))
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
