import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { expect } from "chai";
import { useFakeTimers } from "sinon";

import { localizedFormat } from "../index.js";

chai.use(chaiDatetime);
chai.use(sinonChai);

let clock;

const now = new Date();

describe("Creates correctly", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it("it should return the correct formatted timestamp in dst", async () => {
    const now = "2020-06-05T23:42:50.000Z";
    const formatted = localizedFormat(now, -300);

    expect(formatted).to.equal("2020-06-05T19:42:50-04:00");
  });
  it("it should return the correct formatted timestamp outside of dst", async () => {
    const now = "2020-01-05T23:42:50.000Z";
    const formatted = localizedFormat(now, -300);

    expect(formatted).to.equal("2020-01-05T18:42:50-05:00");
  });
});
