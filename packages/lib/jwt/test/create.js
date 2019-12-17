const { expect } = require("chai")
  .use(require("sinon-chai"))
  .use(require("chai-datetime"));
const { restore, replace, useFakeTimers, fake } = require("sinon");

const { create } = require("..");

const base64url = require("../src/clean_base64");
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
    const uuid = "some-uuid";
    replace(deps, "uuid", fake.returns(uuid));
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
    const signature = Buffer.from("some-signature").toString("base64");
    const signFnFake = fake.returns(signature);
    const result = await create({ payload, options, signFn: signFnFake });

    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    const stringifiedHeader = JSON.stringify(header);
    const encodedHeader = base64url(
      Buffer.from(stringifiedHeader).toString("base64")
    );
    const stringifiedPayload = JSON.stringify({
      root,
      a: 1,
      iss: issuer,
      aud: audience,
      sub: subject,
      exp: deps.timestamp() + expiresIn,
      iat: deps.timestamp(),
      jti: uuid
    });
    const encodedPayload = base64url(
      Buffer.from(stringifiedPayload).toString("base64")
    );
    const token = `${encodedHeader}.${encodedPayload}`;

    expect(signFnFake).to.have.been.calledWith(token);

    expect(result).to.equal(`${token}.${base64url(signature)}`);
  });
});
