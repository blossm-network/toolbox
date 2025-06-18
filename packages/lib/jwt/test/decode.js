import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { create, decode } from "../index.js";

const audience = "some-aud";
const algorithm = "ES256";
const options = {
  issuer: "some-iss",
  subject: "some-sub",
  audience,
  expiresIn: 60,
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
