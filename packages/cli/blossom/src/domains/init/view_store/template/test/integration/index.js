const { expect } = require("chai");

const request = require("@sustainers/request");
const uuid = require("@sustainers/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("View store integration tests", () => {
  const id = uuid();
  it("should return successfully", async () => {
    const response0 = await request.put(`${url}/${id}`, {
      body: {
        name: "some-name"
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${id}`);
    const parsedBody1 = JSON.parse(response1.body);
    expect(response1.statusCode).to.equal(200);
    expect(parsedBody1.name).to.equal("some-name");

    const response2 = await request.put(`${url}/${id}`, {
      body: {
        name: "some-other-name"
      }
    });

    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${id}`);
    const parsedBody3 = JSON.parse(response3.body);
    expect(response3.statusCode).to.equal(200);
    expect(parsedBody3.name).to.equal("some-other-name");

    const response4 = await request.get(url);
    const parsedBody4 = JSON.parse(response4.body);
    expect(response4.statusCode).to.equal(200);
    expect(parsedBody4[0].name).to.equal("some-other-name");

    const id2 = uuid();
    const response5 = await request.put(`${url}/${id2}`, {
      body: {
        name: "some-other-name"
      }
    });

    expect(response5.statusCode).to.equal(204);

    let counter = 0;
    await request.stream(`${url}/stream`, data => {
      counter++;
      const parsedData = JSON.parse(data.toString().trim());
      expect(parsedData.name).to.equal("some-other-name");
    });
    expect(counter).to.equal(2);

    const response6 = await request.delete(`${url}/${id}`);
    const parsedBody6 = JSON.parse(response6.body);
    expect(response6.statusCode).to.equal(200);
    expect(parsedBody6.deletedCount).to.equal(1);

    const response7 = await request.delete(`${url}/${id2}`);
    const parsedBody7 = JSON.parse(response7.body);
    expect(response7.statusCode).to.equal(200);
    expect(parsedBody7.deletedCount).to.equal(1);

    const response8 = await request.get(`${url}/${id}`);
    expect(response8.statusCode).to.equal(404);
  });

  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, { body: { name: { a: 1 } } });
    expect(response.statusCode).to.equal(500);
  });
});
