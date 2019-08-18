const { expect } = require("chai").use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");
const datetime = require("@sustainer-network/datetime");
const validateCommand = require("..");

const now = new Date();

const goodBody = {
  name: "some-command",
  traceId: "traceId!",
  issuedTimestamp: datetime.fineTimestamp() - 2,
  payload: { a: 1 },
  issuerInfo: {
    id: "good-id",
    ip: "good-ip"
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
    expect(await validateCommand(goodBody)).to.not.throw;
  });
  it("should throw if a bad command is passed", async () => {
    const body = {
      ...goodBody,
      command: 123
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should not throw if a no command is passed", async () => {
    const body = {
      ...goodBody,
      command: undefined
    };

    expect(await validateCommand(body)).to.not.throw;
  });
  it("should throw if a bad issuerInfo is passed", async () => {
    const body = {
      ...goodBody,
      command: 123
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a no issuerInfo is passed", async () => {
    const body = {
      ...goodBody,
      issuerInfo: undefined
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a bad issuerId is passed", async () => {
    const body = {
      ...goodBody,
      "issuerInfo.id": 123
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a no issuerId is passed", async () => {
    const body = {
      ...goodBody,
      "issuerInfo.id": undefined
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a bad issuerIp is passed", async () => {
    const body = {
      ...goodBody,
      "issuerInfo.ip": 123
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if no issuerIp is passed", async () => {
    const body = {
      ...goodBody,
      "issuerInfo.ip": undefined
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a bad traceId is passed", async () => {
    const body = {
      ...goodBody,
      traceId: 123
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should allow no traceId is passed", async () => {
    const body = {
      ...goodBody,
      traceId: undefined
    };
    expect(await validateCommand(body)).to.not.throw;
  });
  it("should throw if a bad issuedTimestamp is passed", async () => {
    const body = {
      ...goodBody,
      issuedTimestamp: "bad"
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a no issuedTimestamp is passed", async () => {
    const body = {
      ...goodBody,
      issuedTimestamp: undefined
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a future issuedTimestamp is passed", async () => {
    const body = {
      ...goodBody,
      issuedTimestamp: datetime.fineTimestamp + 1
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a distant past issuedTimestamp is passed", async () => {
    const body = {
      ...goodBody,
      issuedTimestamp: 123
    };

    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should throw if a bad payload is passed", async () => {
    const body = {
      ...goodBody,
      payload: 123
    };
    expect(async () => await validateCommand(body)).to.throw;
  });
  it("should not throw if a no payload is passed", async () => {
    const body = {
      ...goodBody,
      payload: undefined
    };
    expect(await validateCommand(body)).to.not.throw;
  });
});
