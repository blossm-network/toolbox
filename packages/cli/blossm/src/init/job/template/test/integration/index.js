require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command handler integration tests", () => {
  it("should return successfully", async () => {
    const name = "A-name";
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          name
        }
      }
    });

    expect(response.statusCode).to.equal(204);
  });
});
