// require("localenv");
// const { expect } = require("chai");
// const { string: stringDate } = require("@blossm/datetime");
// const uuid = require("@blossm/uuid");
// const { create, delete: del } = require("@blossm/gcp-pubsub");

// const request = require("@blossm/request");

// const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

// const { topics } = require("./../../config.json");

describe("Custom command handler integration tests", () => {
  // before(async () => await Promise.all(topics.map(t => create(t))));
  // after(async () => await Promise.all(topics.map(t => del(t))));
  // it("should return successfully", async () => {
  //   const response = await request.post(url, {
  //     body: {
  //       headers: {
  //         issued: stringDate(),
  //         id: uuid()
  //       },
  //       payload: {
  //         name: "Some-name"
  //       }
  //     }
  //   });
  //   expect(response.statusCode).to.equal(200);
  // });
});
