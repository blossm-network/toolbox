import * as chai from "chai";
import chaiDatetime from "chai-datetime";
import sinonChai from "sinon-chai";
import { expect } from "chai";
import { useFakeTimers } from "sinon";

import { string } from "../index.js";

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

  it("it should return a timestamp that equals now", async () => {
    const nowString = string();

    expect(new Date(Date.parse(nowString))).to.equalDate(now);
  });
});
