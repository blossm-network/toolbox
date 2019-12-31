// require("localenv");
// const { expect } = require("chai");
// const uuid = require("@blossm/uuid");
// const { create, delete: del } = require("@blossm/gcp-pubsub");

// const request = require("@blossm/request");

// const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

// const topic = "some-topic";
// const version = 0;
// const created = "now";
// const id = "some-id";
// const action = "some-action";
// const domain = "some-domain";
// const service = "some-service";
// const network = "some-network";
// const issued = "now";

describe("Custom event store integration tests", () => {
  // before(async () => await create(topic));
  // after(async () => await del(topic));
  // it("should return successfully", async () => {
  //   const root = uuid();
  //   const response0 = await request.post(url, {
  //     body: {
  //       headers: {
  //         root,
  //         topic,
  //         version,
  //         created,
  //         command: {
  //           id,
  //           action,
  //           domain,
  //           service,
  //           network,
  //           issued
  //         }
  //       },
  //       payload: {
  //         name: "some-name"
  //       }
  //     }
  //   });
  //   expect(response0.statusCode).to.equal(204);
  //   const response1 = await request.get(`${url}/${root}`);
  //   const parsedBody1 = JSON.parse(response1.body);
  //   expect(response1.statusCode).to.equal(200);
  //   expect(parsedBody1.state.name).to.equal("some-name");
  //   const response2 = await request.post(url, {
  //     body: {
  //       headers: {
  //         root,
  //         topic,
  //         version,
  //         created,
  //         command: {
  //           id,
  //           action,
  //           domain,
  //           service,
  //           network,
  //           issued
  //         }
  //       },
  //       payload: {
  //         name: "some-other-name"
  //       }
  //     }
  //   });
  //   expect(response2.statusCode).to.equal(204);
  //   const response3 = await request.get(`${url}/${root}`);
  //   const parsedBody3 = JSON.parse(response3.body);
  //   expect(response3.statusCode).to.equal(200);
  //   expect(parsedBody3.state.name).to.equal("some-other-name");
  // });
});
