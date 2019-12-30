require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const id0 = "some-id";
const id1 = "some-other-id";
const name = "some-name";

describe("View gateway integration tests", () => {
  before(async () => {
    await Promise.all([
      viewStore({
        name: "some-name"
      }).update(id0, {
        name
      }),
      viewStore({
        name: "some-other-name"
      }).update(id1, {
        name
      })
    ]);
  });
  it("should return successfully with no auth", async () => {
    const response = await request.get(`${url}/some-other-name`, {
      body: {
        name
      }
    });

    expect(response.statusCode).to.equal(200);

    const view = JSON.parse(response.body);

    expect(view.name).to.equal(name);
  });
  it("should return an error if accessing stores that requires auth", async () => {
    const response = await request.get(`${url}/some-name`, {
      body: {
        name
      }
    });

    expect(response.statusCode).to.equal(401);
  });
});
