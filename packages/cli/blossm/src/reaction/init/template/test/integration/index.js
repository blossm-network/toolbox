require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Reaction integration tests", () => {
  it("should return successfully", async () => {
    const event = "An event";
    const response = await request.post(url, {
      body: {
        event,
      },
    });

    expect(response.statusCode).to.equal(204);
  });
});
