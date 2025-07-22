import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import operationUrl from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const host = "some-host";
const path = "/some-path";
const id = "some-id";
const protocol = "https";

describe("Service url", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "some-env";
  });
  afterEach(restore);
  it("should return the correct output", () => {
    const result = operationUrl({ protocol, host, path, id });
    expect(result).to.equal(`${protocol}://${host}/some-path/some-id`);
  });
  it("should return the correct output in local env", () => {
    process.env.NODE_ENV = "local";
    const result = operationUrl({ protocol, host, id });
    expect(result).to.equal(`${protocol}://${host}/some-id`);
  });
  it("should return the correct output with no path", () => {
    const result = operationUrl({ protocol, host, id });
    expect(result).to.equal(`${protocol}://${host}/some-id`);
  });
  it("should return the correct output with no path or id", () => {
    const result = operationUrl({ protocol, host });
    expect(result).to.equal(`${protocol}://${host}`);
  });
});
