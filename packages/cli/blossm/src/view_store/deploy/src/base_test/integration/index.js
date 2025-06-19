import "localenv";
import * as chai from "chai";

import request from "@blossm/request";
import uuid from "@blossm/uuid";
// const eventStore = require("@blossm/event-store-rpc");
// const createEvent = require("@blossm/create-event");

import { schema, key, testing, one, group, indexes } from "../../config.json";

const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const contextRoot = "some-context-root";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";

const principalRoot = "some-principal-root";
const principalService = "some-principal-service";
const principalNetwork = "some-principal-network";

//These must match whats in merge-cli-template
const groupRoot = "some-group-root";
const groupService = "some-group-service";
const groupNetwork = "some-group-network";

//TODO test idStream
//TODO test text query
describe("View store base integration tests", () => {
  const testParamQueries = async () => {
    const id = "some-id";
    const examples = testing.examples;
    expect(examples.length).to.be.greaterThan(1);

    if (testing.empty) {
      const emptyResponse = await request.get(url, {
        query: {
          context: {
            ...(process.env.CONTEXT && {
              [process.env.CONTEXT]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            }),
            ...(group && {
              principal: {
                root: principalRoot,
                service: principalService,
                network: principalNetwork,
              },
            }),
          },
        },
      });

      expect(emptyResponse.statusCode).to.equal(200);

      const {
        updates: emptyUpdates,
        count: emptyCount,
        content: emptyContent,
      } = JSON.parse(emptyResponse.body);

      expect(emptyCount).to.equal(0);
      expect(emptyUpdates).to.exist;

      for (const key in testing.empty) {
        expect(emptyContent[key]).to.deep.equal(testing.empty[key]);
      }
    }

    const response0 = await request.put(`${url}/${id}`, {
      body: {
        update: examples[0].update,
        context: {
          ...(process.env.CONTEXT && {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          }),
          ...(group && {
            groups: [
              {
                root: groupRoot,
                service: groupService,
                network: groupNetwork,
              },
            ],
          }),
        },
        ...(group && {
          groups: [
            {
              root: groupRoot,
              service: groupService,
              network: groupNetwork,
            },
          ],
        }),
      },
    });

    expect(response0.statusCode).to.equal(200);
    if (key) {
      expect(JSON.parse(response0.body).keys).to.exist;
    }

    if (group) {
      const forbiddenResponse = await request.get(url, {
        query: {
          context: {},
        },
      });

      expect(forbiddenResponse.statusCode).to.equal(403);
    }

    const response1 = await request.get(url, {
      query: {
        context: {
          ...(process.env.CONTEXT && {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          }),
          ...(group && {
            principal: {
              root: principalRoot,
              service: principalService,
              network: principalNetwork,
            },
          }),
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

    for (const key in examples[0].get) {
      expect(parsedBody0[key]).to.deep.equal(examples[0].get[key]);
    }

    for (const example of testing.examples.length > 2
      ? testing.examples.slice(2)
      : []) {
      const moreId = uuid();
      const moreResponse0 = await request.put(`${url}/${moreId}`, {
        body: {
          update: example.update,
          context: {
            ...(process.env.CONTEXT && {
              [process.env.CONTEXT]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            }),
          },
          ...(group && {
            groups: [
              {
                root: groupRoot,
                service: groupService,
                network: groupNetwork,
              },
            ],
          }),
        },
      });

      expect(moreResponse0.statusCode).to.equal(200);

      const moreResponse1 = await request.get(url, {
        query: {
          ...(example.query && { query: example.query }),
          context: {
            ...(process.env.CONTEXT && {
              [process.env.CONTEXT]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            }),
            ...(group && {
              principal: {
                root: principalRoot,
                service: principalService,
                network: principalNetwork,
              },
            }),
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
      for (const key in example.get) {
        expect(moreParsedBody[key]).to.deep.equal(example.get[key]);
      }
    }

    const response2 = await request.put(`${url}/${id}`, {
      body: {
        update: examples[1].update,
        context: {
          ...(process.env.CONTEXT && {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          }),
        },
        ...(group && {
          groups: [
            {
              root: groupRoot,
              service: groupService,
              network: groupNetwork,
            },
          ],
        }),
      },
    });

    expect(response2.statusCode).to.equal(200);

    const response3 = await request.get(url, {
      query: {
        context: {
          ...(process.env.CONTEXT && {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          }),
          ...(group && {
            principal: {
              root: principalRoot,
              service: principalService,
              network: principalNetwork,
            },
          }),
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

    for (const key in examples[1].get) {
      expect(parsedBody1[key]).to.deep.equal(examples[1].get[key]);
    }

    if (testing.sorts) {
      for (const sort of testing.sorts) {
        const index = indexes[sort.index][0];
        let reverseIndex = {};
        for (const key in index) reverseIndex[key] = -index[key];

        const newContextRoot = "some-new-context-root";
        for (const example of examples) {
          await request.put(`${url}/${uuid()}`, {
            body: {
              update: example.update,
              context: {
                ...(process.env.CONTEXT && {
                  [process.env.CONTEXT]: {
                    root: newContextRoot,
                    service: contextService,
                    network: contextNetwork,
                  },
                }),
              },
              ...(group && {
                groups: [
                  {
                    root: groupRoot,
                    service: groupService,
                    network: groupNetwork,
                  },
                ],
              }),
            },
          });
        }
        const response5 = await request.get(url, {
          query: {
            context: {
              ...(process.env.CONTEXT && {
                [process.env.CONTEXT]: {
                  root: newContextRoot,
                  service: contextService,
                  network: contextNetwork,
                },
              }),
              ...(group && {
                principal: {
                  root: principalRoot,
                  service: principalService,
                  network: principalNetwork,
                },
              }),
            },
            sort: index,
          },
        });

        const {
          updates: updates2,
          count: count2,
          content: content2,
        } = JSON.parse(response5.body);

        const firstSortFirst = one ? content2 : content2[0];
        const firstSortLast = one ? null : content2[content2.length - 1];

        expect(updates2).to.exist;
        !one ? expect(count2).to.equal(2) : expect(count2).to.be.undefined;

        const response6 = await request.get(url, {
          query: {
            context: {
              ...(process.env.CONTEXT && {
                [process.env.CONTEXT]: {
                  root: newContextRoot,
                  service: contextService,
                  network: contextNetwork,
                },
              }),
              ...(group && {
                principal: {
                  root: principalRoot,
                  service: principalService,
                  network: principalNetwork,
                },
              }),
            },
            sort: reverseIndex,
          },
        });

        const {
          updates: updates3,
          count: count3,
          content: content3,
        } = JSON.parse(response6.body);

        const secondSortFirst = one ? content3 : content3[0];
        const secondSortLast = one ? null : content3[content3.length - 1];
        expect(updates3).to.exist;
        !one ? expect(count3).to.equal(2) : expect(count3).to.be.undefined;

        if (one) {
          expect(firstSortFirst).to.deep.equal(secondSortFirst);
        } else {
          expect(firstSortFirst).to.deep.equal(secondSortLast);
          expect(firstSortLast).to.deep.equal(secondSortFirst);
        }

        //add all remaining examples
        for (const example of examples.length > 2 ? examples.slice(2) : []) {
          await request.put(`${url}/${uuid()}`, {
            body: {
              update: example,
              context: {
                ...(process.env.CONTEXT && {
                  [process.env.CONTEXT]: {
                    root: newContextRoot,
                    service: contextService,
                    network: contextNetwork,
                  },
                }),
              },
              ...(group && {
                groups: [
                  {
                    root: groupRoot,
                    service: groupService,
                    network: groupNetwork,
                  },
                ],
              }),
            },
          });
        }
        if (!one) {
          const response7 = await request.get(url, {
            query: {
              context: {
                ...(process.env.CONTEXT && {
                  [process.env.CONTEXT]: {
                    root: newContextRoot,
                    service: contextService,
                    network: contextNetwork,
                  },
                }),
                ...(group && {
                  principal: {
                    root: principalRoot,
                    service: principalService,
                    network: principalNetwork,
                  },
                }),
              },
              sort: index,
            },
          });

          const { content: sortedContent } = JSON.parse(response7.body);

          for (let i = 0; i < sortedContent.length; i++) {
            for (const key in examples[sort.order[i]].get.get) {
              expect(sortedContent[i][key]).to.deep.equal(examples[1].get[key]);
            }
          }
        }
        //double all examples
        for (const example of examples) {
          await request.put(`${url}/${uuid()}`, {
            body: {
              update: example.update,
              context: {
                ...(process.env.CONTEXT && {
                  [process.env.CONTEXT]: {
                    root: newContextRoot,
                    service: contextService,
                    network: contextNetwork,
                  },
                }),
              },
              ...(group && {
                groups: [
                  {
                    root: groupRoot,
                    service: groupService,
                    network: groupNetwork,
                  },
                ],
              }),
            },
          });
        }

        const response8 = await request.get(url, {
          query: {
            context: {
              ...(process.env.CONTEXT && {
                [process.env.CONTEXT]: {
                  root: newContextRoot,
                  service: contextService,
                  network: contextNetwork,
                },
              }),
              ...(group && {
                principal: {
                  root: principalRoot,
                  service: principalService,
                  network: principalNetwork,
                },
              }),
            },
            limit: 1,
            skip: 1,
            sort: index,
          },
        });

        const {
          updates: updates4,
          content: content4,
          count: count4,
        } = JSON.parse(response8.body);

        !one && expect(content4).to.have.length(1);
        expect(updates4).to.exist;
        !one
          ? expect(count4).to.equal(examples.length * 2)
          : expect(count4).to.be.undefined;

        const formattedExample2Get = examples[sort.order[0]];
        for (const key in formattedExample2Get.get) {
          expect((!one ? content4[0] : content4)[key]).to.deep.equal(
            formattedExample2Get.get[key]
          );
        }
      }
    }

    const response9 = await request.delete(`${url}/${id}`, {
      query: {
        context: {
          ...(process.env.CONTEXT && {
            [process.env.CONTEXT]: {
              root: contextRoot,
              service: contextService,
              network: contextNetwork,
            },
          }),
        },
      },
    });

    const parsedBody9 = JSON.parse(response9.body);
    expect(response9.statusCode).to.equal(200);
    expect(parsedBody9.deletedCount).to.equal(1);
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
      const response = await request.put(`${url}/${id}`, {
        body: {
          update: { id, [property]: badValue },
          context: {
            ...(process.env.CONTEXT && {
              [process.env.CONTEXT]: {
                root: contextRoot,
                service: contextService,
                network: contextNetwork,
              },
            }),
          },
          ...(group && {
            groups: [
              {
                root: groupRoot,
                service: groupService,
                network: groupNetwork,
              },
            ],
          }),
        },
      });
      expect(response.statusCode).to.equal(500);
      return;
    }
  });
});
