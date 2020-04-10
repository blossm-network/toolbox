const { expect } = require("chai").use(require("chai-as-promised"));

const { create, decode } = require("..");

const audience = "some-aud";
const algorithm = "ES256";
const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience,
  expiresIn: 60
};

describe("Validate", () => {
  it("it should decode a valid jwt token", async () => {
    const sig = "some-signature";
    const token = await create({ options, signFn: () => sig });
    const { headers, claims } = await decode(token);

    expect(claims).to.exist;
    expect(headers.alg).to.equal(algorithm);
  });
});
