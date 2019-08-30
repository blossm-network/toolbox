const { expect } = require("chai")
  .use(require("sinon-chai"))
  .use(require("chai-datetime"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const { create } = require("..");

const base64url = require("../src/base64_url");
const deps = require("../deps");

const expiresIn = 300;

let clock;

const now = new Date();

describe("Create", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("it should create a jwt token if all variables are passed in", async () => {
    const nonce = "some-nonce";
    replace(deps, "nonce", fake.returns(nonce));
    const issuer = "some-issuer";
    const subject = "some-subject";
    const audience = "some-audience";
    const root = "some-root";
    const options = {
      issuer,
      subject,
      audience,
      expiresIn
    };
    const payload = {
      root,
      a: 1
    };
    const signature = "some-signature";
    const signFnFake = fake.returns(signature);
    const result = await create({ payload, options, signFn: signFnFake });

    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    const stringifiedHeader = deps.Utf8.parse(JSON.stringify(header));
    const encodedHeader = base64url(stringifiedHeader);
    const stringifiedPayload = deps.Utf8.parse(
      JSON.stringify({
        root,
        a: 1,
        iss: issuer,
        aud: audience,
        sub: subject,
        exp: deps.timestamp() + expiresIn,
        iat: deps.timestamp(),
        jti: nonce
      })
    );
    const encodedPayload = base64url(stringifiedPayload);
    const token = `${encodedHeader}.${encodedPayload}`;

    expect(signFnFake).to.have.been.calledWith(token);

    expect(result).to.equal(
      `${token}.${base64url(deps.Utf8.parse(signature))}`
    );
  });
});
