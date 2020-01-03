require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

const { schema } = require("../../config.json");
const uuid = require("@blossm/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { examples, indexes } = require("../../config.json");

const queryString = (properties, example) => {
  let string = "";
  for (const property in properties) {
    string += `${property}=${example[property]}`;
  }
  return string;
};

describe("View store base integration tests", () => {
  const example0 = examples[0];
  const example1 = examples[1];

  it("should have examples", () => {
    expect(example0).to.exist;
    expect(example1).to.exist;
  });
  it("should return successfully", async () => {
    const id = uuid();
    const response0 = await request.put(`${url}/${id}`, {
      body: example0.put || example0
    });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}/${id}`);
    const parsedBody1 = JSON.parse(response1.body);

    expect(response1.statusCode).to.equal(200);
    for (const key in example0.result || example0) {
      expect(parsedBody1[key]).to.equal((example0.result || example0)[key]);
    }

    const response2 = await request.put(`${url}/${id}`, {
      body: example1.put || example1
    });

    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${id}`);
    const parsedBody3 = JSON.parse(response3.body);
    expect(response3.statusCode).to.equal(200);
    for (const key in example1.result || example1) {
      expect(parsedBody3[key]).to.equal((example1.result || example1)[key]);
    }

    ///Test indexes
    for (const index of indexes) {
      const _queryString = queryString(
        index[0],
        example1.query || example1.result || example1
      );
      const response4 = await request.get(`${url}?${_queryString}`);
      expect(response4.statusCode).to.equal(200);

      const parsedBody4 = JSON.parse(response4.body);
      for (const key in example1.result || example1) {
        expect(parsedBody4[0][key]).to.equal(
          (example1.result || example1)[key]
        );
      }
    }

    //Test get with no query
    const response5 = await request.get(url);
    const parsedBody5 = JSON.parse(response5.body);
    expect(response5.statusCode).to.equal(200);
    for (const key in example1.result || example1) {
      expect(parsedBody5[0][key]).to.equal((example1.result || example1)[key]);
    }

    //Test streaming
    const id2 = uuid();
    const response6 = await request.put(`${url}/${id2}`, {
      body: example1.put || example1
    });
    expect(response6.statusCode).to.equal(204);
    let counter = 0;
    await request.stream(`${url}/stream`, data => {
      counter++;
      const parsedData = JSON.parse(data.toString().trim());
      for (const key in example1.result || example1) {
        expect(parsedData[key]).to.equal((example1.result || example1)[key]);
      }
    });
    expect(counter).to.equal(2);

    //Test delete
    const response7 = await request.delete(`${url}/${id}`);
    const parsedBody7 = JSON.parse(response7.body);
    expect(response7.statusCode).to.equal(200);
    expect(parsedBody7.deletedCount).to.equal(1);
  });

  it("should return an error if incorrect params", async () => {
    //Grab a property from the schema and pass a wrong value to it.
    for (const property in schema) {
      const badValue =
        schema[property] == "String" ||
        (typeof schema[property] == "object" &&
          schema[property]["type"] == "String")
          ? { a: 1 } //pass an object to a String property
          : "some-string"; // or, pass a string to a non-String property
      const response = await request.post(url, {
        body: { [property]: badValue }
      });
      expect(response.statusCode).to.equal(500);
      return;
    }
  });
});
