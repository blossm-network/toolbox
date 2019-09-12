const { expect } = require("chai");
const cleanCommand = require("..");

describe("Clean command", () => {
  it("should clean the request correctly", async () => {
    const payload = { a: 2 };

    const params = {
      bogus: 1,
      header: {
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
      header: {
        source: {}
      }
    });
  });
  it("should add a payload", async () => {
    const params = {
      header: {}
    };

    await cleanCommand(params);

    expect(params).to.deep.equal({
      header: {},
      payload: {}
    });
  });
});
