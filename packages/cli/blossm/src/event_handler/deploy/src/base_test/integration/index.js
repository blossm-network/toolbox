require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");

const request = require("@blossm/request");

const { testing } = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Event handler integration tests", () => {
  it("should return successfully", async () => {
    const parallelFns = [];
    for (const example of testing.examples) {
      const response = await request.post(url, {
        body: {
          message: {
            data: Buffer.from(
              JSON.stringify({
                headers: { context: example.context, root: example.root },
                payload: example.payload
              })
            )
          }
        }
      });

      expect(response.statusCode).to.equal(204);

      for (const result of example.results) {
        parallelFns.push(async () => {
          const v = await viewStore({
            name: result.store.name,
            domain: result.store.domain
          }).read(result.root ? { root: result.root } : result.query);

          if (result.value) {
            for (const property in result.value) {
              expect(v[property]).to.exist;
              if (result.value[property] != undefined) {
                expect(v[property]).to.deep.equal(result.value[property]);
              }
            }
          } else if (result.values) {
            expect(result.values.length).to.equal(v.length);
            for (const value of result.values) {
              expect(
                v.some(view => {
                  for (const property in value) {
                    expect(view[property]).to.exist;
                    if (value[property] != undefined) {
                      expect(view[property]).to.deep.equal(value[property]);
                    }
                  }
                })
              );
            }
          }
        });
      }
    }
    await Promise.all(parallelFns);
  });
});
