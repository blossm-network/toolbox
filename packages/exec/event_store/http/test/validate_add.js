const { expect } = require("chai");
const validate = require("../src/validate_add");

const goodBody = {
  store: "some-store-id",
  service: "some-service",
  event: {
    fact: {
      root: "someRoot",
      topic: "a.topic",
      version: 0,
      commandInstanceId: "someid",
      command: "a.command",
      commandIssuedTimestamp: 123,
      traceId: "a-trace-id",
      createdTimestamp: 10
    },
    payload: {
      a: 1,
      b: 2
    }
  }
};

describe("Validate add", () => {
  it("should handle correct params correctly", async () => {
    expect(await validate(goodBody)).to.not.throw;
  });
  it("should throw if a bad store is passed", async () => {
    const body = {
      ...goodBody,
      store: ""
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no store is passed", async () => {
    const body = {
      ...goodBody,
      store: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad service is passed", async () => {
    const body = {
      ...goodBody,
      service: ""
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no service is passed", async () => {
    const body = {
      ...goodBody,
      service: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad event is passed", async () => {
    const body = {
      ...goodBody,
      event: 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no event is passed", async () => {
    const body = {
      ...goodBody,
      event: undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad payload is passed", async () => {
    const body = {
      ...goodBody,
      "event.payload": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no payload is passed", async () => {
    const body = {
      ...goodBody,
      "event.payload": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad fact is passed", async () => {
    const body = {
      ...goodBody,
      "event.fact": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no fact is passed", async () => {
    const body = {
      ...goodBody,
      "event.fact": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad root passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.root": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no root is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.root": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad topic is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.topic": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no topic is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.topic": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad version is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.version": {}
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no version is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.version": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad command instance id is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.commandInstanceId": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no command instance id is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.commandInstanceId": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad command is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.command": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no command is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.command": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad command issued timestamp is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.commandIssuedTimestamp": "nope"
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no command issues timestamp is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.command": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if a bad trace id is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.traceId": 123
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should not throw if no traceId is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.traceId": undefined
    };

    expect(async () => await validate(body)).to.not.throw;
  });
  it("should throw if a bad created timestamp is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.createdTimestamp": "nope"
    };

    expect(async () => await validate(body)).to.throw;
  });
  it("should throw if no created timestamp is passed", async () => {
    const body = {
      ...goodBody,
      "events.fact.createdTimestamp": undefined
    };

    expect(async () => await validate(body)).to.throw;
  });
});
