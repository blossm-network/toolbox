require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Get job integration tests", () => {
  it("should return successfully", async () => {
    const name = "A-name";
    const response = await request.post(url, {
      query: {
        name
      }
    });

    expect(response.statusCode).to.equal(204);
  });
});
