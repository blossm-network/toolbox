require("localenv");
const { expect } = require("chai");
const { string: dateString } = require("@blossm/datetime");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Job integration tests", () => {
  it("should return successfully", async () => {
    const name = "A-name";
    const response = await request.post(url, {
      body: {
        headers: {
          issued: dateString(),
          accepted: dateString()
        },
        payload: {
          name
        }
      }
    });

    expect(response.statusCode).to.equal(204);
  });
});
