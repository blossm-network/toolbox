require("localenv");
const { expect } = require("chai");
const viewStore = require("@blossm/view-store-rpc");

const request = require("@blossm/request");

const { testing, name, domain } = require("../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Projection integration tests", () => {
  it("should return successfully", async () => {
    const parallelFns = [];
    for (const example of testing.examples) {
      const response = await request.post(url, {
        body: {
          message: {
            data: Buffer.from(
              JSON.stringify({
                headers: {
                  ...example.headers,
                  context: example.context,
                  root: example.root
                },
                payload: example.payload
              })
            )
          }
        }
      });

      expect(response.statusCode).to.equal(204);

      parallelFns.push(async () => {
        const v = await viewStore({
          name,
          domain
        }).read(
          example.result.root
            ? { root: example.result.root }
            : example.result.query
        );

        if (example.result.value) {
          for (const property in example.result.value) {
            expect(v[0][property]).to.exist;
            if (example.result.value[property] != undefined) {
              expect(v[0][property]).to.deep.equal(
                example.result.value[property]
              );
            }
          }
        } else if (example.result.values) {
          expect(example.result.values.length).to.equal(v.length);
          for (const value of example.result.values) {
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
    await Promise.all(parallelFns.map(fn => fn()));
  });
});
