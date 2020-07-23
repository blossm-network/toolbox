const { expect } = require("chai").use(require("sinon-chai"));
const { useFakeTimers } = require("sinon");
const { string: dateString, stringFromDate } = require("@blossm/datetime");
const validateCommand = require("..");

const now = new Date();

const goodParams = {
  payload: { a: 1 },
  headers: {
    root: "some-root",
    idempotency: "some-idempotency",
  },
  root: "some-root",
};

let clock;

describe("Validate command", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
    goodParams.headers.issued = dateString();
  });
  afterEach(() => {
    clock.restore();
  });
  it("should handle correct params correctly", async () => {
    try {
      validateCommand(goodParams);
    } catch (e) {
      //shouldn't get called
      expect(1).to.equal(0);
    }
  });
  it("should throw if a bad header is passed", async () => {
    const params = {
      ...goodParams,
      headers: 123,
    };
    try {
      await validateCommand(params);

      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should throw if no header is passed", async () => {
    const params = {
      ...goodParams,
      headers: undefined,
    };
    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should throw if a bad issued timestamp is passed", async () => {
    const params = {
      ...goodParams,
      headers: {
        ...goodParams.headers,
        issued: "bad",
      },
    };
    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should throw if no issued timestamp is passed", async () => {
    const params = {
      ...goodParams,
      headers: {
        ...goodParams.headers,
        issued: undefined,
      },
    };

    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should throw if a future issued is passed", async () => {
    const params = {
      ...goodParams,
      headers: {
        ...goodParams.headers,
        issued: stringFromDate(new Date(now.getTime() + 60000)),
      },
    };

    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should throw if a distant past issued is passed", async () => {
    const params = {
      ...goodParams,
      headers: {
        ...goodParams.headers,
        issued: stringFromDate(new Date(234)),
      },
    };

    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(400);
    }
  });
  it("should throw if a bad payload is passed", async () => {
    const params = {
      ...goodParams,
      payload: 123,
    };
    try {
      await validateCommand(params);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  });
  it("should not throw if a no payload is passed", async () => {
    const params = {
      ...goodParams,
      payload: undefined,
    };
    try {
      validateCommand(params);
    } catch (e) {
      //shouldn't get called
      expect(1).to.equal(0);
    }
  });
  it("should not throw if a no root is passed", async () => {
    const params = {
      ...goodParams,
      ...goodParams.headers,
      root: undefined,
    };
    try {
      validateCommand(params);
    } catch (e) {
      //shouldn't get called
      expect(1).to.equal(0);
    }
  });
  it("should not throw if a no headers idempotency is passed", async () => {
    const params = {
      ...goodParams,
      headers: {
        ...goodParams.headers,
        idempotency: undefined,
      },
    };
    try {
      validateCommand(params);
    } catch (e) {
      //shouldn't get called
      expect(1).to.equal(0);
    }
  });
});
