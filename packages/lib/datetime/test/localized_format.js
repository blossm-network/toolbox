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

  it("it should return the correct formatted timestamp with a daylight-saving offset", async () => {
    const now = "2020-06-05T23:42:50.000Z";
    const formatted = localizedFormat(now, -240);

    expect(formatted).to.equal("2020-06-05T19:42:50-04:00");
  });
  it("it should return the correct formatted timestamp outside of dst", async () => {
    const now = "2020-01-05T23:42:50.000Z";
    const formatted = localizedFormat(now, -300);

    expect(formatted).to.equal("2020-01-05T18:42:50-05:00");
  });
});

describe("Explicit UTC offsets", () => {
  it("keeps UTC and fixed-offset regions unchanged during New York summer", () => {
    const instant = "2025-06-01T12:00:00Z";
    expect(localizedFormat(instant, 0)).to.equal("2025-06-01T12:00:00Z");
    expect(localizedFormat(instant, 330)).to.equal("2025-06-01T17:30:00+05:30");
  });
});
