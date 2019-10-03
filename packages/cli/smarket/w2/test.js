const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");

const request = require("@sustainers/request");

const url = "http://command-handler:3000";

process.env.NODE_ENV = "staging";

describe("Command handler store", () => {
  it("should return successfully", async () => {
    const response0 = await request.post(url, {
      headers: {
        issued: stringDate()
      },
      payload: {
        name: "some-name"
      }
    });
    expect(response0.statusCode).to.equal(204);
  });
  // it("should return an error if incorrect params", async () => {
  //   const response = await request.post(url, { name: 1 });
  //   expect(response.statusCode).to.be.at.least(400);
  // });
});
