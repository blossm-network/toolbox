require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Event handler integration tests", () => {
  it("should return successfully", async () => {
    const response = await request.post(url, {
      body: {
        message: {
          data: Buffer.from(
            JSON.stringify({
              headers: { context: "some-context", root: "some-root" },
              payload: { key: "property" }
            })
          )
        }
      }
    });

    expect(response.statusCode).to.equal(204);
  });
});
