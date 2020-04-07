const { expect } = require("chai")
  .use(require("sinon-chai"))
  .use(require("chai-datetime"));
const { restore, replace, useFakeTimers, fake } = require("sinon");
const base64url = require("base64url");

const { create } = require("..");

const deps = require("../deps");

const expiresIn = 300;
const activeIn = 10;

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
      expiresIn,
      activeIn
    };
    const algorithm = "ES256";
    const payload = {
      root,
      a: 1
    };
    const signature = Buffer.from("some-signature").toString("base64");
    const signFnFake = fake.returns(signature);
    const result = await create({
      payload,
      options,
      signFn: signFnFake,
      algorithm
    });

    const header = {
      alg: algorithm,
      typ: "JWT"
    };

    const stringifiedHeader = JSON.stringify(header);
    const encodedHeader = base64url.fromBase64(
      Buffer.from(stringifiedHeader).toString("base64")
    );
    const stringifiedPayload = JSON.stringify({
      root,
      a: 1,
      iss: issuer,
      aud: audience,
      sub: subject,
      exp: deps.stringFromDate(new Date(deps.fineTimestamp() + expiresIn)),
      nbf: deps.stringFromDate(new Date(deps.fineTimestamp() + activeIn)),
      iat: deps.dateString(),
      jti: uuid
    });
    const encodedPayload = base64url.fromBase64(
      Buffer.from(stringifiedPayload).toString("base64")
    );
    const token = `${encodedHeader}.${encodedPayload}`;

    expect(signFnFake).to.have.been.calledWith(token);

    expect(result).to.equal(`${token}.${base64url.fromBase64(signature)}`);
  });
  it("it should create a jwt token if audience is an array", async () => {
    const uuid = "some-uuid";
    replace(deps, "uuid", fake.returns(uuid));
    const issuer = "some-issuer";
    const subject = "some-subject";
    const audience = ["some-audience", "some-other-audience"];
    const root = "some-root";
    const options = {
      issuer,
      subject,
      audience,
      expiresIn,
      activeIn
    };
    const algorithm = "ES256";
    const payload = {
      root,
      a: 1
    };
    const signature = Buffer.from("some-signature").toString("base64");
    const signFnFake = fake.returns(signature);
    const result = await create({
      payload,
      options,
      signFn: signFnFake,
      algorithm
    });

    const header = {
      alg: algorithm,
      typ: "JWT"
    };

    const stringifiedHeader = JSON.stringify(header);
    const encodedHeader = base64url.fromBase64(
      Buffer.from(stringifiedHeader).toString("base64")
    );
    const stringifiedPayload = JSON.stringify({
      root,
      a: 1,
      iss: issuer,
      aud: "some-audience,some-other-audience",
      sub: subject,
      exp: deps.stringFromDate(new Date(deps.fineTimestamp() + expiresIn)),
      nbf: deps.stringFromDate(new Date(deps.fineTimestamp() + activeIn)),
      iat: deps.dateString(),
      jti: uuid
    });
    const encodedPayload = base64url.fromBase64(
      Buffer.from(stringifiedPayload).toString("base64")
    );
    const token = `${encodedHeader}.${encodedPayload}`;

    expect(signFnFake).to.have.been.calledWith(token);

    expect(result).to.equal(`${token}.${base64url.fromBase64(signature)}`);
  });
  it("it should create a jwt token with optionals missing", async () => {
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
      alg: "ES256",
      typ: "JWT"
    };

    const stringifiedHeader = JSON.stringify(header);
    const encodedHeader = base64url.fromBase64(
      Buffer.from(stringifiedHeader).toString("base64")
    );
    const stringifiedPayload = JSON.stringify({
      root,
      a: 1,
      iss: issuer,
      aud: audience,
      sub: subject,
      exp: deps.stringFromDate(new Date(deps.fineTimestamp() + expiresIn)),
      nbf: deps.stringFromDate(new Date(deps.fineTimestamp())),
      iat: deps.dateString(),
      jti: uuid
    });
    const encodedPayload = base64url.fromBase64(
      Buffer.from(stringifiedPayload).toString("base64")
    );
    const token = `${encodedHeader}.${encodedPayload}`;

    expect(signFnFake).to.have.been.calledWith(token);

    expect(result).to.equal(`${token}.${base64url.fromBase64(signature)}`);
  });
});
