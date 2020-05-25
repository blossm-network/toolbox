require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Function integration tests", () => {
  it("should return successfully", async () => {
    const response = await request.post(url, {
      body: {
        any: "thing",
      },
    });

    expect(response.statusCode).to.equal(200);
  });
});
