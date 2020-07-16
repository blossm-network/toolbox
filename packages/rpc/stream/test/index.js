const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, stub, match } = require("sinon");
const stream = require("..");

const deps = require("../deps");

const context = { b: 4 };
const claims = "some-claims";
const operarationPart1 = "some-operaration1";
const operarationPart2 = "some-operaration2";
const otherOperarationPart1 = "some-other-operaration1";
const otherOperarationPart2 = "some-other-operaration2";
const token = "some-token";
const otherToken = "some-other-token";
const type = "some-type";
const otherType = "some-other-type";
const id = "some-id";
const otherQuery = {
  b: 2,
};
const tokenFn = "some-token-fn";
const currentToken = "some-current-token";
const url = "some-url";
const otherUrl = "some-other-url";

const host = "some-host";

describe("Operation", () => {
  beforeEach(() => {
    process.env.HOST = host;
    process.env.NODE_ENV = "not-local";
  });
  afterEach(() => {
    restore();
  });

  it("should call stream with the correct params", async () => {
    const streamManyFake = fake();
    replace(deps, "streamMany", streamManyFake);

    const operationTokenFake = stub()
      .onFirstCall()
      .returns({ token, type })
      .onSecondCall()
      .returns({ token: otherToken, type: otherType });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = stub()
      .onFirstCall()
      .returns(url)
      .onSecondCall()
      .returns(otherUrl);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const sortFn = "some-sort-fn";
    const query = {
      id,
      a: 1,
    };
    const result = await stream(
      [
        { operation: [operarationPart1, operarationPart2], query },
        {
          operation: [otherOperarationPart1, otherOperarationPart2],
          query: otherQuery,
        },
      ],
      fnFake,
      sortFn
    )
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(streamManyFake).to.have.been.calledWith(
      [
        {
          url,
          query: {
            a: 1,
            context,
            claims,
            token: currentToken,
          },
          headers: {
            authorization: `${type} ${token}`,
          },
        },
        {
          url: otherUrl,
          query: {
            b: 2,
            context,
            claims,
            token: currentToken,
          },
          headers: {
            authorization: `${otherType} ${otherToken}`,
          },
        },
      ],
      match((func) => {
        const obj = { a: 1 };
        const stringObj = JSON.stringify(obj);
        const buffer = Buffer.from(stringObj);
        func(buffer);
        return fnFake.calledWith({ a: 1 });
      }),
      sortFn
    );
    expect(operationTokenFake.getCall(0)).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationTokenFake.getCall(1)).to.have.been.calledWith({
      tokenFn,
      operation: [otherOperarationPart1, otherOperarationPart2],
    });
    expect(operationUrlFake.getCall(0)).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(operationUrlFake.getCall(1)).to.have.been.calledWith({
      operation: [otherOperarationPart1, otherOperarationPart2],
      host,
    });
    expect(result).to.equal();
  });
  it("should call stream with the correct params with multiple parsedData", async () => {
    const streamManyFake = fake();
    replace(deps, "streamMany", streamManyFake);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const sortFn = "some-sort-fn";
    const query = {
      id,
      a: 1,
    };
    const result = await stream(
      [{ operation: [operarationPart1, operarationPart2], query }],
      fnFake,
      sortFn
    )
      .in({ context, host })
      .with({ internalTokenFn: tokenFn, currentToken, claims });

    expect(streamManyFake).to.have.been.calledWith(
      [
        {
          url,
          query: {
            a: 1,
            context,
            claims,
            token: currentToken,
          },
          headers: {
            authorization: `${type} ${token}`,
          },
        },
      ],
      match((func) => {
        const response = func("some-data");
        return Promise.resolve(response) == response;
      }),
      sortFn
    );
    expect(operationTokenFake).to.have.been.calledWith({
      tokenFn,
      operation: [operarationPart1, operarationPart2],
    });
    expect(operationUrlFake).to.have.been.calledWith({
      operation: [operarationPart1, operarationPart2],
      host,
      id,
    });
    expect(result).to.equal();
    const obj = { a: 1, b: { c: 3 } };
    const obj1 = { k: 1, b: { c: 3 } };
    const obj2 = { p: 1, b: { c: 3 } };
    const stringObj = JSON.stringify(obj);
    const stringObj1 = JSON.stringify(obj1);
    const stringObj2 = JSON.stringify(obj2);
    const leftover = '{ "q": 3';
    const buffer = Buffer.from(stringObj + stringObj1 + stringObj2 + leftover);
    await streamManyFake.lastCall.args[1](buffer);
    await streamManyFake.lastCall.args[1](Buffer.from('}{ "w": 4'));
    await streamManyFake.lastCall.args[1](Buffer.from("}"));
    expect(fnFake.getCall(0)).to.have.been.calledWith({ a: 1, b: { c: 3 } });
    expect(fnFake.getCall(1)).calledWith({ k: 1, b: { c: 3 } });
    expect(fnFake.getCall(2)).calledWith({ p: 1, b: { c: 3 } });
    expect(fnFake.getCall(3)).calledWith({ q: 3 });
    expect(fnFake.getCall(4)).calledWith({ w: 4 });
  });
  it("should return error correctly", async () => {
    const errorStatusCode = 400;
    const statusMessage = "some-status-message";
    const errorMessage = "some-error-message";
    const info = { some: "info" };
    const code = "some-code";
    const errBody = { message: errorMessage, info, code };
    const streamManyFake = fake.returns({
      statusCode: errorStatusCode,
      statusMessage,
      body: JSON.stringify(errBody),
    });
    replace(deps, "streamMany", streamManyFake);

    const operationTokenFake = fake.returns({ token, type });
    replace(deps, "operationToken", operationTokenFake);

    const operationUrlFake = fake.returns(url);
    replace(deps, "operationUrl", operationUrlFake);

    const fnFake = fake();
    const sortFn = "some-sort-fn";
    const query = {
      id,
      a: 1,
    };
    const error = "some-error";
    const constructErrorFake = fake.returns(error);
    replace(deps, "constructError", constructErrorFake);

    try {
      await stream(
        [{ operation: [operarationPart1, operarationPart2], query }],
        fnFake,
        sortFn
      )
        .in({ context, host })
        .with({ internalTokenFn: tokenFn, currentToken, claims });

      expect(3).to.equal(4);
    } catch (e) {
      expect(constructErrorFake).to.have.been.calledWith({
        statusCode: errorStatusCode,
        message: errorMessage,
        info,
        code,
      });
      expect(e).to.equal(error);
    }
  });
});
