require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");

// const { schema } = require("../../config.json");
// const uuid = require("@blossm/uuid");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

// const { testing, indexes = [] } = require("../../config.json");
const { testing } = require("../../config.json");

// const makeQuery = (properties, example) => {
//   let obj = {};
//   for (const property in properties) {
//     obj[property] = example[property];
//   }
//   return obj;
// };

describe("View store base integration tests", () => {
  const testParamQueries = async () => {
    const root = testing.examples.id.root;
    const example0 = testing.examples.query.first;
    const example1 = testing.examples.query.second;
    expect(example0).to.exist;
    expect(example1).to.exist;

    const contextRoot = "some-context-root";
    const contextService = "some-context-service";
    const contextNetwork = "some-context-network";

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      a: 1,
      context: process.env.CONTEXT,
      domain: process.env.DOMAIN,
      service: process.env.SERVICE
    });

    const response0 = await request.put(`${url}${root ? `/${root}` : ""}`, {
      body: {
        view: {
          body: {
            ...example0.put.body
          },
          headers: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork
            }
          }
        }
      }
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ response0 });

    expect(response0.statusCode).to.equal(204);

    const response1 = await request.get(`${url}${root ? `/${root}` : ""}`, {
      query: {
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork
          }
        }
      }
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ response1 });

    const [parsedBody1] = JSON.parse(response1.body);
    // const root = parsedBody1.headers.root;

    //TODO
    //eslint-disable-next-line no-console
    console.log({ parsedBody1 });

    expect(response1.statusCode).to.equal(200);
    for (const key in example0.get) {
      expect(parsedBody1.body[key]).to.deep.equal(example0.get[key]);
    }

    const response2 = await request.put(`${url}/${root}`, {
      body: {
        view: {
          ...example1.put
        }
      }
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ response2 });

    expect(response2.statusCode).to.equal(204);

    const response3 = await request.get(`${url}/${root}`);
    //TODO
    //eslint-disable-next-line no-console
    console.log({ response3 });
    expect(response3.statusCode).to.equal(200);
    const parsedBody3 = JSON.parse(response3.body);
    //TODO
    //eslint-disable-next-line no-console
    console.log({ parsedBody3 });
    for (const key in example1.get) {
      expect(parsedBody3.body[key]).to.deep.equal(example1.get[key]);
    }

    const response4 = await request.delete(`${url}/${root}`);
    const parsedBody4 = JSON.parse(response4.body);
    expect(response4.statusCode).to.equal(200);
    expect(parsedBody4.deletedCount).to.equal(1);
  };

  // const testIndexes = async () => {
  //   const example0 = testing.examples.index;
  //   expect(example0).to.exist;

  //   const id = uuid();

  //   const response = await request.put(`${url}/${id}`, {
  //     body: {
  //       view: {
  //         ...example0.put
  //       }
  //     }
  //   });

  //   expect(response.statusCode).to.equal(204);

  //   ///Test indexes
  //   for (const index of indexes) {
  //     const query = makeQuery(index[0], example0.query);
  //     const response1 = await request.get(url, {
  //       query: {
  //         query,
  //         context: example0.context
  //       }
  //     });
  //     expect(response1.statusCode).to.equal(200);

  //     const parsedBody4 = JSON.parse(response1.body);
  //     for (const key in example0.get) {
  //       expect(parsedBody4[0][key]).to.deep.equal(example0.get[key]);
  //     }
  //   }
  // };

  // const testStreaming = async () => {
  //   const example0 = testing.examples.stream.first;
  //   const example1 = testing.examples.stream.second;
  //   const context = testing.examples.stream.context;
  //   const query = testing.examples.stream.query;

  //   expect(example0).to.exist;
  //   expect(example1).to.exist;

  //   const id0 = uuid();
  //   const id1 = uuid();

  //   const response = await request.put(`${url}/${id0}`, {
  //     body: {
  //       view: example0.put
  //     }
  //   });
  //   expect(response.statusCode).to.equal(204);
  //   const response1 = await request.put(`${url}/${id1}`, {
  //     body: { view: example1.put }
  //   });
  //   expect(response1.statusCode).to.equal(204);
  //   let ids = [];
  //   await request.stream(
  //     `${url}/stream`,
  //     data => {
  //       const parsedData = JSON.parse(data.toString().trim());
  //       ids.push(parsedData.id);

  //       if (data.id == id0) {
  //         for (const key in example0.get) {
  //           expect(parsedData[key]).to.deep.equal(example0.get[key]);
  //         }
  //       }
  //       if (data.id == id1) {
  //         for (const key in example1.get) {
  //           expect(parsedData[key]).to.deep.equal(example1.get[key]);
  //         }
  //       }
  //     },
  //     { query: { query, context } }
  //   );
  //   expect(ids).to.include(id0);
  //   expect(ids).to.include(id1);
  // };

  it("should return successfully", async () => {
    await testParamQueries();
    // await testIndexes();
    // await testStreaming();
  });

  // it("should return an error if incorrect params", async () => {
  //   //Grab a property from the schema and pass a wrong value to it.
  //   for (const property in schema) {
  //     const badValue =
  //       schema[property] == "String" ||
  //       (typeof schema[property] == "object" &&
  //         schema[property]["type"] == "String")
  //         ? { a: 1 } //pass an object to a String property
  //         : "some-string"; // or, pass a string to a non-String property
  //     const root = "some-root";
  //     const response = await request.put(`${url}/${root}`, {
  //       body: { view: { [property]: badValue } }
  //     });
  //     expect(response.statusCode).to.equal(500);
  //     return;
  //   }
  // });
});
