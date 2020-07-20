require("localenv");
const { expect } = require("chai");

const request = require("@blossm/request");
const uuid = require("@blossm/uuid");

const { schema } = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing, one, indexes } = require("../../config.json");

const contextRoot = "some-context-root";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";

describe("View store base integration tests", () => {
  const testParamQueries = async () => {
    const id = "some-id";
    const example0 = testing.examples.first;
    const example1 = testing.examples.second;
    expect(example0).to.exist;
    expect(example1).to.exist;

    const response0 = await request.post(url, {
      body: {
        query: {
          id,
        },
        update: {
          body: {
            id,
            ...example0.update,
          },
        },
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      },
    });

    expect(response0.statusCode).to.equal(200);

    const response1 = await request.get(url, {
      query: {
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      },
    });

    expect(response1.statusCode).to.equal(200);
    const { updates: updates0, count: count0, content: content0 } = JSON.parse(
      response1.body
    );

    const parsedBody0 = one ? content0 : content0[0];

    expect(updates0).to.exist;
    !one ? expect(count0).to.equal(1) : expect(count0).to.be.undefined;

    expect(response1.statusCode).to.equal(200);
    for (const key in example0.get) {
      expect(parsedBody0.body[key]).to.deep.equal(example0.get[key]);
    }

    for (const more of testing.examples.more || []) {
      const moreId = uuid();
      const moreResponse0 = await request.post(url, {
        body: {
          id: moreId,
          update: {
            body: more.update,
          },
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },
        },
      });

      expect(moreResponse0.statusCode).to.equal(200);

      const moreResponse1 = await request.get(url, {
        query: {
          ...(more.query && { query: more.query }),
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },
        },
      });

      const {
        updates: moreUpdate,
        count: moreCount,
        content: moreContent,
      } = JSON.parse(response1.body);

      const moreParsedBody = one ? moreContent : moreContent[0];

      expect(moreUpdate).to.exist;
      !one ? expect(moreCount).to.equal(1) : expect(moreCount).to.be.undefined;

      expect(moreResponse1.statusCode).to.equal(200);
      for (const key in more.get) {
        expect(moreParsedBody.body[key]).to.deep.equal(more.get[key]);
      }
    }

    const response2 = await request.post(url, {
      body: {
        query: {
          id,
        },
        update: {
          body: example1.update,
        },
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      },
    });

    expect(response2.statusCode).to.equal(200);

    const response3 = await request.get(url, {
      query: {
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      },
    });

    expect(response3.statusCode).to.equal(200);
    const { updates: updates1, count: count1, content: content1 } = JSON.parse(
      response3.body
    );

    const parsedBody1 = one ? content1 : content1[0];

    expect(updates1).to.exist;
    !one ? expect(count1).to.equal(1) : expect(count1).to.be.undefined;

    for (const key in example1.get) {
      expect(parsedBody1.body[key]).to.deep.equal(example1.get[key]);
    }

    const otherId = "a";
    await request.post(url, {
      body: {
        id: otherId,
        update: {
          body: example1.update,
        },
        context: {
          [process.env.CONTEXT]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      },
    });

    if (indexes) {
      //TODO
      console.log({ indexes, zero: indexes[0][0] });
      const response5 = await request.get(url, {
        query: {
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },
          sort: indexes[0][0],
        },
      });

      const {
        updates: updates2,
        count: count2,
        content: content2,
      } = JSON.parse(response5.body);

      const firstSort1 = one ? content2 : content2[0];
      const firstSort2 = one ? null : content2[1];

      expect(updates2).to.exist;
      !one ? expect(count2).to.equal(2) : expect(count2).to.be.undefined;

      const inverseIndexes = {};
      for (const key in indexes[0][0]) {
        inverseIndexes[key] = -indexes[0][0][key];
      }
      //TODO
      console.log({ inverseIndexes });
      const response6 = await request.get(url, {
        query: {
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },

          sort: inverseIndexes,
        },
      });

      const {
        updates: updates3,
        count: count3,
        content: content3,
      } = JSON.parse(response6.body);

      const secondSort1 = one ? content3 : content3[0];
      const secondSort2 = one ? null : content3[1];
      expect(updates3).to.exist;
      !one ? expect(count3).to.equal(2) : expect(count3).to.be.undefined;

      if (one) {
        expect(firstSort1).to.deep.equal(secondSort1);
      } else {
        expect(firstSort1).to.deep.equal(secondSort2);
        expect(firstSort2).to.deep.equal(secondSort1);
      }

      const yetAnotherId = "z";
      await request.post(url, {
        body: {
          id: yetAnotherId,
          update: {
            body: { a: 1 },
          },
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },
        },
      });

      if (!one) {
        const response7 = await request.get(url, {
          query: {
            context: {
              [process.env.CONTEXT]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            },
            limit: 1,
            skip: 1,
            sort: indexes[0][0],
          },
        });

        const {
          updates: updates4,
          content: content4,
          count: count4,
        } = JSON.parse(response7.body);

        expect(content4).to.have.length(1);
        expect(updates4).to.exist;
        !one ? expect(count4).to.equal(3) : expect(count4).to.be.undefined;

        expect(content4[0]).to.deep.equal(firstSort2);
      }
    }

    const response8 = await request.delete(url, {
      id,
      context: {
        [process.env.CONTEXT]: {
          root: contextRoot,
          service: contextService,
          network: contextNetwork,
        },
      },
    });
    const parsedBody8 = JSON.parse(response8.body);
    expect(response8.statusCode).to.equal(200);
    expect(parsedBody8.deletedCount).to.equal(1);
  };

  // const testStreaming = async () => {
  //   const example0 = testing.examples.first;
  //   const example1 = testing.examples.second;

  //   expect(example0).to.exist;
  //   expect(example1).to.exist;

  //   const id0 = "some-id";
  //   const id1 = "some-other-id";

  //   const response = await request.post(url, {
  //     body: {
  //       query: {
  //         id: id0,
  //       },
  //       view: {
  //         body: { id: id0, ...example0.put },
  //         headers: {
  //           [process.env.CONTEXT]: {
  //             root: contextRoot,
  //             service: contextService,
  //             network: contextNetwork,
  //           },
  //         },
  //       },
  //     },
  //   });

  //   expect(response.statusCode).to.equal(200);
  //   const response1 = await request.put(`${url}/${root1}`, {
  //     body: {
  //       view: {
  //         body: example1.put,
  //         headers: {
  //           [process.env.CONTEXT]: {
  //             root: contextRoot,
  //             service: contextService,
  //             network: contextNetwork,
  //           },
  //           ...(domainRoot && {
  //             [process.env.DOMAIN]: {
  //               root: domainRoot,
  //               service: process.env.SERVICE,
  //               network: process.env.NETWORK,
  //             },
  //           }),
  //         },
  //       },
  //     },
  //   });
  //   expect(response1.statusCode).to.equal(200);
  //   let roots = [];
  //   await request.stream(
  //     `${url}/stream${domainRoot ? `/${domainRoot}` : ""}`,
  //     (data) => {
  //       const parsedData = JSON.parse(data.toString().trim());
  //       roots.push(parsedData.headers.root);

  //       if (data.root == root0) {
  //         for (const key in example0.get) {
  //           if (key == "root") {
  //             expect(parsedData.body[key]).to.deep.equal(root0);
  //           } else {
  //             expect(parsedData.body[key]).to.deep.equal(example0.get[key]);
  //           }
  //         }
  //       }

  //       if (data.roots == root1) {
  //         for (const key in example1.get) {
  //           if (key == "root") {
  //             expect(parsedData.body[key]).to.deep.equal(root1);
  //           } else {
  //             expect(parsedData.body[key]).to.deep.equal(example1.get[key]);
  //           }
  //         }
  //       }
  //     },
  //     {
  //       query: {
  //         context: {
  //           [process.env.CONTEXT]: {
  //             root: contextRoot,
  //             service: contextService,
  //             network: contextNetwork,
  //           },
  //         },
  //       },
  //     }
  //   );
  //   expect(roots).to.include(root0);
  //   expect(roots).to.include(root1);
  // };

  it("should return successfully", async () => {
    await testParamQueries();
    // await testStreaming();
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
      const id = "some-id";
      const response = await request.post(url, {
        body: {
          query: {
            id,
          },
          update: {
            body: { id, [property]: badValue },
          },
          context: {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          },
        },
      });
      expect(response.statusCode).to.equal(500);
      return;
    }
  });
});
