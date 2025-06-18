import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import { expect } from "chai";
import { useFakeTimers } from "sinon";

import { moment } from "../index.js";

chai.use(chaiDatetime);

let clock;

const now = new Date();

describe("Creates correctly", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });

  afterEach(() => {
    clock.restore();
  });

  it("it should return a moment that equals now", async () => {
    const nowTimestamp = now.getTime();

    expect(moment().utc().valueOf()).to.equal(nowTimestamp);
  });
});
