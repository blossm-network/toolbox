const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 2 };

    const params = {
      bogus: 1,
      headers: {
        nope: 2,
        source: {
          bogus: 3
        }
      },
      payload
    };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      payload,
      headers: {
        source: {}
      }
    });
  });
  it("should add a payload", async () => {
    const params = {
      headers: {}
    };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      headers: {},
      payload: {}
    });
  });
});
