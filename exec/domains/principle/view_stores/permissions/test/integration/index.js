require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");
const uuid = require("@blossm/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const scope = "some-type";

describe("View store integration tests", () => {
  const id = uuid();
  it("should return successfully", async () => {
    const response0 = await request.put(`${url}/${id}`, {
      body: {
        add: scope
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${id}`);
    const parsedBody1 = JSON.parse(response1.body);
    expect(response1.statusCode).to.equal(200);
    expect(parsedBody1.permissions.length).to.equal(1);
    expect(parsedBody1.permissions[0]).to.equal(scope);

    const id2 = uuid();
    const response2 = await request.put(`${url}/${id2}`, {
      body: {
        add: scope
      }
    });

    expect(response2.statusCode).to.equal(204);

    let counter = 0;
    await request.stream(`${url}/stream`, data => {
      counter++;
      const parsedData = JSON.parse(data.toString().trim());
      expect(parsedData.permissions.length).to.equal(1);
      expect(parsedData.permissions[0]).to.equal(scope);
    });
    expect(counter).to.equal(2);

    const response3 = await request.put(`${url}/${id}`, {
      body: {
        remove: scope
      }
    });

    expect(response3.statusCode).to.equal(204);

    const response4 = await request.get(`${url}/${id}`);
    const parsedBody4 = JSON.parse(response4.body);
    expect(response4.statusCode).to.equal(200);
    expect(parsedBody4.permissions.length).to.equal(0);

    const response5 = await request.delete(`${url}/${id}`);
    const parsedBody5 = JSON.parse(response5.body);
    expect(response5.statusCode).to.equal(200);
    expect(parsedBody5.deletedCount).to.equal(1);

    const response6 = await request.delete(`${url}/${id2}`);
    const parsedBody6 = JSON.parse(response6.body);
    expect(response6.statusCode).to.equal(200);
    expect(parsedBody6.deletedCount).to.equal(1);

    const response7 = await request.get(`${url}/${id}`);
    expect(response7.statusCode).to.equal(404);
  });

  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, {
      body: { permissions: { a: 1 } }
    });
    expect(response.statusCode).to.equal(500);
  });
});
