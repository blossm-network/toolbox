require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");
const uuid = require("@blossm/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const type = "some-type";
const root = "some-root";
describe("View store integration tests", () => {
  const id = uuid();
  it("should return successfully", async () => {
    const response0 = await request.put(`${url}/${id}`, {
      body: {
        add: {
          type,
          root
        }
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${id}`);
    const parsedBody1 = JSON.parse(response1.body);
    expect(response1.statusCode).to.equal(200);
    expect(parsedBody1.contexts.length).to.equal(1);
    expect(parsedBody1.contexts[0].type).to.equal(type);
    expect(parsedBody1.contexts[0].root).to.equal(root);
  });
});
