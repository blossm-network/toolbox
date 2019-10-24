const { expect } = require("chai");

const request = require("@sustainers/request");
const uuid = require("@sustainers/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("View store", () => {
  const id = uuid();
  it("should return successfully", async () => {
    const response0 = await request.put(`${url}/${id}`, {
      body: {
        phone: "some-phone",
        principle: "some-principle"
      }
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.put(`${url}/${id}`, {
      body: {
        phone: "some-other-phone"
      }
    });
    expect(response1.statusCode).to.equal(204);

    const response2 = await request.get(`${url}/${id}`);
    expect(response2.statusCode).to.equal(200);
    expect(JSON.parse(response2.body).phone).to.equal("some-other-phone");
    expect(JSON.parse(response2.body).principle).to.equal("some-principle");

    const response3 = await request.get(url);
    expect(response3.statusCode).to.equal(200);
    expect(JSON.parse(response3.body)[0].phone).to.equal("some-other-phone");

    const id2 = uuid();
    const response4 = await request.put(`${url}/${id2}`, {
      body: {
        phone: "some-other-phone"
      }
    });

    expect(response4.statusCode).to.equal(204);

    let counter = 0;
    await request.stream(`${url}/stream`, data => {
      counter++;
      expect(JSON.parse(data.toString().trim()).phone).to.equal(
        "some-other-phone"
      );
    });
    expect(counter).to.equal(2);

    const response5 = await request.delete(`${url}/${id}`);
    expect(response5.statusCode).to.equal(200);
    expect(JSON.parse(response5.body).deletedCount).to.equal(1);

    const response6 = await request.delete(`${url}/${id2}`);
    expect(response6.statusCode).to.equal(200);
    expect(JSON.parse(response6.body).deletedCount).to.equal(1);

    const response7 = await request.get(`${url}/${id}`);
    expect(response7.statusCode).to.equal(404);
  });

  it("should return an error if incorrect params", async () => {
    const response = await request.post(url, { body: { phone: { a: 1 } } });
    expect(response.statusCode).to.equal(500);
  });
});
