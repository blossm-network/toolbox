const { expect } = require("chai");
const encode = require("..");

describe("Url encode", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });
  it("should call get with correct params", async () => {
    const params = {
      hello: "there",
      how: ["are", "you"],
      andy: [0, "ur dogs?"],
      dandy: { a: 1 },
    };
    const url = "http://google.com";
    const response = await encode(url, params);
    expect(response).to.equal(
      `${url}?hello=there&how%5B0%5D=are&how%5B1%5D=you&andy%5B0%5D=0&andy%5B1%5D=ur%20dogs%3F&dandy%5Ba%5D=1`
    );
  });
  it("should call get with no params", async () => {
    const url = "http://google.com";
    const reseponse = await encode(url);
    expect(reseponse).to.deep.equal(url);
  });
});
