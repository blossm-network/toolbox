const { expect } = require("chai");

const request = require("@sustainers/request");
const uuid = require("@sustainers/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("View store", () => {
  const id = uuid();
  it("should return successfully", async () => {
    const response0 = await request.put(`${url}/${id}`, {
      name: "some-name"
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.put(`${url}/${id}`, {
      name: "some-other-name"
    });
    expect(response1.statusCode).to.equal(204);

    //eslint-disable-next-line no-console
    console.log("bout to 1");
    const response2 = await request.get(`${url}/${id}`);
    expect(response2.statusCode).to.equal(200);
    expect(JSON.parse(response2.body).name).to.equal("some-other-name");

    //eslint-disable-next-line no-console
    console.log("bout to 2");
    const response3 = await request.get(url);
    expect(response3.statusCode).to.equal(200);
    expect(JSON.parse(response3.body)[0].name).to.equal("some-other-name");

    //eslint-disable-next-line no-console
    console.log("bout to");
    await request.stream(`${url}/stream`, null, data => {
      //eslint-disable-next-line no-console
      console.log("GOT A DATA: ", data);
      //eslint-disable-next-line no-console
      console.log("GOT A DATA parsed: ", data.toString());
      //eslint-disable-next-line no-console
      console.log("GOT A DATA parsed and trimmed: ", data.toString().trim());
      expect(JSON.parse(data.toString().trim()).name).to.equal(
        "some-other-name"
      );
    });
    //eslint-disable-next-line no-console
    console.log("done");

    const response4 = await request.delete(`${url}/${id}`);
    expect(response4.statusCode).to.equal(200);
    expect(JSON.parse(response4.body).deletedCount).to.equal(1);

    const response5 = await request.get(`${url}/${id}`);
    expect(response5.statusCode).to.equal(404);
  });
  // it("should return an error if incorrect params", async () => {
  //   const response = await request.post(url, { name: 1 });
  //   expect(response.statusCode).to.be.at.least(400);
  // });
});
