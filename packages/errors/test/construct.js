const { expect } = require("chai");
const { construct } = require("..");

const message = "some-message";
const info = { some: "info" };

describe("Construct", () => {
  it("400 correct", () => {
    const error = construct({ statusCode: 400, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      code: "BadRequest",
      info: {},
      message,
    });
  });
  it("400 correct with info", () => {
    const error = construct({ statusCode: 400, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 400,
      code: "BadRequest",
      info,
      message,
    });
  });
  it("401 correct", () => {
    const error = construct({ statusCode: 401, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info: {},
      message,
    });
  });
  it("401 correct with info", () => {
    const error = construct({ statusCode: 401, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 401,
      code: "Unauthorized",
      info,
      message,
    });
  });
  it("409 correct", () => {
    const error = construct({ statusCode: 409, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info: {},
      message,
    });
  });
  it("409 correct with info", () => {
    const error = construct({ statusCode: 409, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      info,
      message,
    });
  });
  it("409 Conflict correct", () => {
    const error = construct({ statusCode: 409, code: "Conflict", message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "Conflict",
      info: {},
      message,
    });
  });
  it("409 correct with info", () => {
    const error = construct({
      statusCode: 409,
      code: "Conflict",
      message,
      info,
    });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "Conflict",
      info,
      message,
    });
  });
  it("404 correct", () => {
    const error = construct({ statusCode: 403, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 403,
      code: "Forbidden",
      info: {},
      message,
    });
  });
  it("404 correct with info", () => {
    const error = construct({ statusCode: 403, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 403,
      code: "Forbidden",
      info,
      message,
    });
  });
  it("404 correct", () => {
    const error = construct({ statusCode: 404, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info: {},
      message,
    });
  });
  it("404 correct with info", () => {
    const error = construct({ statusCode: 404, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 404,
      code: "ResourceNotFound",
      info,
      message,
    });
  });
  it("500 correct", () => {
    const error = construct({ statusCode: 500, message });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      info: {},
      message,
    });
  });
  it("500 correct with info", () => {
    const error = construct({ statusCode: 500, message, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      info,
      message,
    });
  });
});
